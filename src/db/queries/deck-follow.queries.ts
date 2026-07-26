import { db } from '@/db';
import { deckAuditEvents, deckFollows, deckReleases, decks } from '@/db/schema';
import { resolveFollowReleaseId } from '@/lib/deck-access-policy';
import { DeckDomainError } from '@/lib/deck-domain';
import { and, count, eq, or, sql } from 'drizzle-orm';
import { safeDeckReleaseSelection } from '@/db/queries/deck-release-selection';

export async function getProtectedDeckFollowerCount(deckId: number): Promise<number> {
  const [result] = await db
    .select({ value: count(deckFollows.id) })
    .from(deckFollows)
    .where(
      and(
        eq(deckFollows.deckId, deckId),
        or(eq(deckFollows.status, 'active'), eq(deckFollows.status, 'frozen')),
      ),
    );
  return Number(result.value);
}

export async function getDeckFollowState(deckId: number, userId: string) {
  const [row] = await db
    .select({ follow: deckFollows, currentRelease: safeDeckReleaseSelection })
    .from(deckFollows)
    .innerJoin(decks, eq(decks.id, deckFollows.deckId))
    .leftJoin(deckReleases, eq(deckReleases.id, decks.currentReleaseId))
    .where(and(eq(deckFollows.deckId, deckId), eq(deckFollows.userId, userId)))
    .limit(1);
  if (!row) return null;

  const studiedReleaseId = resolveFollowReleaseId(row.follow, row.currentRelease?.id ?? null);
  const [studiedRelease] = studiedReleaseId
    ? await db
        .select(safeDeckReleaseSelection)
        .from(deckReleases)
        .where(eq(deckReleases.id, studiedReleaseId))
        .limit(1)
    : [undefined];

  return {
    status: row.follow.status,
    updateMode: row.follow.updateMode,
    currentRelease: row.currentRelease,
    studiedRelease: studiedRelease ?? null,
    updateAvailable: Boolean(
      row.currentRelease && studiedRelease && row.currentRelease.version > studiedRelease.version,
    ),
  };
}

export async function followDeck(deckId: number, userId: string) {
  return db.transaction(async tx => {
    const [deck] = await tx.select().from(decks).where(eq(decks.id, deckId)).for('update').limit(1);
    if (
      !deck ||
      !deck.currentReleaseId ||
      (deck.visibility === 'private' && deck.ownerId !== userId)
    ) {
      throw new DeckDomainError('NOT_FOLLOWABLE', 'Deck is not available to follow.');
    }

    if (deck.status !== 'active') {
      throw new DeckDomainError('DECK_INACTIVE', 'Cannot follow an inactive deck.');
    }

    await tx
      .insert(deckFollows)
      .values({
        userId,
        deckId,
        lastSeenReleaseId: deck.currentReleaseId,
        status: 'active',
        unfollowedAt: null,
      })
      .onConflictDoUpdate({
        target: [deckFollows.userId, deckFollows.deckId],
        set: { status: 'active', unfollowedAt: null, followedAt: new Date() },
      });
    await tx
      .insert(deckAuditEvents)
      .values({ deckId, actorId: userId, eventType: 'deck.followed' });
  });
}

export async function unfollowDeck(deckId: number, userId: string) {
  await db.transaction(async tx => {
    await tx
      .update(deckFollows)
      .set({ status: 'unfollowed', unfollowedAt: new Date() })
      .where(and(eq(deckFollows.deckId, deckId), eq(deckFollows.userId, userId)));
    await tx
      .insert(deckAuditEvents)
      .values({ deckId, actorId: userId, eventType: 'deck.unfollowed' });
  });
}

export async function setFollowRelease(
  deckId: number,
  userId: string,
  releaseId: number,
  mode: 'automatic' | 'manual',
) {
  await db.transaction(async tx => {
    const [release] = await tx
      .select({ id: deckReleases.id })
      .from(deckReleases)
      .where(and(eq(deckReleases.id, releaseId), eq(deckReleases.deckId, deckId)))
      .limit(1);
    if (!release) {
      throw new DeckDomainError('INVALID_RELEASE', 'Release does not belong to this deck.');
    }

    const updated = await tx
      .update(deckFollows)
      .set({
        updateMode: mode,
        pinnedReleaseId: mode === 'manual' ? releaseId : null,
        lastSeenReleaseId: releaseId,
      })
      .where(
        and(
          eq(deckFollows.deckId, deckId),
          eq(deckFollows.userId, userId),
          or(eq(deckFollows.status, 'active'), eq(deckFollows.status, 'frozen')),
        ),
      )
      .returning({ id: deckFollows.id });
    if (!updated.length) {
      throw new DeckDomainError('FOLLOW_NOT_FOUND', 'Active follow not found.');
    }

    await tx.insert(deckAuditEvents).values({
      deckId,
      actorId: userId,
      eventType: mode === 'manual' ? 'deck.release_pinned' : 'deck.follow_automatic',
      metadata: { releaseId },
    });
  });
}

export async function updateFollowToLatest(deckId: number, userId: string) {
  await db.transaction(async tx => {
    const [deck] = await tx
      .select({ currentReleaseId: decks.currentReleaseId, status: decks.status })
      .from(decks)
      .where(eq(decks.id, deckId))
      .limit(1);
    if (!deck?.currentReleaseId || deck.status === 'moderation_removed') {
      throw new DeckDomainError('INVALID_RELEASE', 'No accessible current release exists.');
    }

    const updated = await tx
      .update(deckFollows)
      .set({
        updateMode: 'automatic',
        pinnedReleaseId: null,
        lastSeenReleaseId: deck.currentReleaseId,
      })
      .where(
        and(
          eq(deckFollows.deckId, deckId),
          eq(deckFollows.userId, userId),
          or(eq(deckFollows.status, 'active'), eq(deckFollows.status, 'frozen')),
        ),
      )
      .returning({ id: deckFollows.id });
    if (!updated.length) {
      throw new DeckDomainError('FOLLOW_NOT_FOUND', 'Active follow not found.');
    }

    await tx.insert(deckAuditEvents).values({
      deckId,
      actorId: userId,
      eventType: 'deck.follow_updated_latest',
      metadata: { releaseId: deck.currentReleaseId },
    });
  });
}

export async function permanentlyDeleteFollowProgress(deckId: number, userId: string) {
  await db.transaction(async tx => {
    const [relationship] = await tx
      .select({ id: deckFollows.id })
      .from(deckFollows)
      .where(and(eq(deckFollows.deckId, deckId), eq(deckFollows.userId, userId)))
      .for('update')
      .limit(1);
    if (!relationship) {
      throw new DeckDomainError('FOLLOW_NOT_FOUND', 'Follow relationship not found.');
    }

    await tx.execute(sql`
      delete from user_vocab_state state
      where state.user_id = ${userId}
      and exists (
        select 1 from release_vocabs rv
        join deck_releases release on release.id = rv.release_id
        where release.deck_id = ${deckId} and rv.vocab_id = state.vocab_id
      )
    `);
    await tx
      .delete(deckFollows)
      .where(and(eq(deckFollows.deckId, deckId), eq(deckFollows.userId, userId)));
    await tx.insert(deckAuditEvents).values({
      deckId,
      actorId: userId,
      eventType: 'deck.follow_progress_deleted',
    });
  });
}
