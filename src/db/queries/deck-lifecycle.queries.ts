import { db } from '@/db';
import { deckAuditEvents, deckFollows, deckReleases, deckReports, decks } from '@/db/schema';
import { getAuthoringUsage, lockAuthoringAccount } from '@/db/queries/authoring-quota.queries';
import { assertAuthoringCapacity } from '@/lib/authoring-quota';
import {
  assertActive,
  assertPolicyInheritance,
  type CopyPolicy,
  type DeckVisibility,
  DeckDomainError,
} from '@/lib/deck-domain';
import { canFinalizeDeckDeletion, getDeckDeletionRetentionUntil } from '@/lib/deck-deletion-policy';
import { and, count, eq, ne, or, sql } from 'drizzle-orm';

export async function changeDeckStatus(
  deckId: number,
  actorId: string,
  status: 'active' | 'archived' | 'deleted',
) {
  await db.transaction(async tx => {
    const [deck] = await tx
      .select()
      .from(decks)
      .where(and(eq(decks.id, deckId), eq(decks.ownerId, actorId)))
      .for('update')
      .limit(1);
    if (!deck) throw new DeckDomainError('NOT_OWNER', 'Deck not found or access denied.');
    if (deck.status === 'moderation_removed') {
      throw new DeckDomainError(
        'MODERATION_REMOVED',
        'A moderation-removed deck cannot be restored.',
      );
    }

    const allowed = deck.status === 'active' ? ['archived', 'deleted'] : ['active'];
    if (!allowed.includes(status)) {
      throw new DeckDomainError(
        'INVALID_TRANSITION',
        `Cannot change ${deck.status} deck to ${status}.`,
      );
    }

    const now = new Date();
    const [followers] =
      status === 'deleted'
        ? await tx
            .select({ value: count(deckFollows.id) })
            .from(deckFollows)
            .where(
              and(
                eq(deckFollows.deckId, deckId),
                or(eq(deckFollows.status, 'active'), eq(deckFollows.status, 'frozen')),
              ),
            )
        : [{ value: 0 }];
    await tx
      .update(decks)
      .set({
        status,
        deletedAt: status === 'deleted' ? now : null,
        retentionUntil:
          status === 'deleted' ? getDeckDeletionRetentionUntil(now, Number(followers.value)) : null,
        updatedAt: now,
      })
      .where(eq(decks.id, deckId));

    if (status !== 'active') {
      await tx
        .update(deckFollows)
        .set({ status: 'frozen', lastSeenReleaseId: deck.currentReleaseId })
        .where(and(eq(deckFollows.deckId, deckId), eq(deckFollows.status, 'active')));
    }
    if (status === 'active') {
      await tx
        .update(deckFollows)
        .set({ status: 'active' })
        .where(and(eq(deckFollows.deckId, deckId), eq(deckFollows.status, 'frozen')));
    }

    await tx.insert(deckAuditEvents).values({
      deckId,
      actorId,
      eventType: status === 'active' ? 'deck.restored' : `deck.${status}`,
      metadata: { previousStatus: deck.status, status },
    });
  });
}

export async function changeDeckVisibility(
  deckId: number,
  actorId: string,
  visibility: DeckVisibility,
) {
  await db.transaction(async tx => {
    const [deck] = await tx
      .select()
      .from(decks)
      .where(and(eq(decks.id, deckId), eq(decks.ownerId, actorId)))
      .for('update')
      .limit(1);
    if (!deck) throw new DeckDomainError('NOT_OWNER', 'Deck not found or access denied.');
    assertActive(deck.status, 'change visibility of');
    await lockAuthoringAccount(tx, actorId);

    if (visibility === 'public' && deck.visibility !== 'public') {
      assertAuthoringCapacity(await getAuthoringUsage(tx, actorId, deckId), { publicDecks: 1 });
    }
    if (visibility !== 'private' && !deck.currentReleaseId) {
      throw new DeckDomainError('UNPUBLISHED_DECK', 'Publish the deck before sharing it.');
    }
    if (visibility !== 'private' && deck.sourceReleaseId) {
      const [source] = await tx
        .select({ policy: deckReleases.copyPolicy })
        .from(deckReleases)
        .where(eq(deckReleases.id, deck.sourceReleaseId))
        .limit(1);
      if (!source || source.policy !== 'public_forks') {
        throw new DeckDomainError(
          'PUBLIC_FORK_FORBIDDEN',
          'The source release only permits private forks.',
        );
      }
    }

    let catalogStatus: 'eligible' | 'duplicate' | 'hidden' =
      visibility === 'private' ? 'hidden' : 'eligible';
    if (visibility !== 'private' && deck.currentReleaseId) {
      const [release] = await tx
        .select({ hash: deckReleases.contentHash })
        .from(deckReleases)
        .where(eq(deckReleases.id, deck.currentReleaseId))
        .limit(1);
      if (release) {
        const duplicateRows = await tx.execute(sql`
          select true as found from decks other
          join deck_releases published on published.id = other.current_release_id
          where other.id <> ${deckId}
            and coalesce(other.root_deck_id, other.id) = ${deck.rootDeckId ?? deck.id}
            and published.content_hash = ${release.hash}
            and other.visibility in ('public', 'unlisted')
            and other.status = 'active'
          limit 1
        `);
        if (duplicateRows.length > 0) catalogStatus = 'duplicate';
      }
    }

    await tx
      .update(decks)
      .set({ visibility, catalogStatus, updatedAt: new Date() })
      .where(eq(decks.id, deckId));
    await tx.insert(deckAuditEvents).values({
      deckId,
      actorId,
      eventType: 'deck.visibility_changed',
      metadata: { visibility, catalogStatus },
    });
  });
}

export async function changeDeckCopyPolicy(
  deckId: number,
  actorId: string,
  copyPolicy: CopyPolicy,
) {
  await db.transaction(async tx => {
    const [deck] = await tx
      .select()
      .from(decks)
      .where(and(eq(decks.id, deckId), eq(decks.ownerId, actorId)))
      .for('update')
      .limit(1);
    if (!deck) throw new DeckDomainError('NOT_OWNER', 'Deck not found or access denied.');
    assertActive(deck.status, 'change the copy policy of');

    if (deck.sourceReleaseId) {
      const [source] = await tx
        .select({ copyPolicy: deckReleases.copyPolicy })
        .from(deckReleases)
        .where(eq(deckReleases.id, deck.sourceReleaseId))
        .limit(1);
      if (!source) throw new DeckDomainError('INVALID_PROVENANCE', 'Source release is missing.');
      assertPolicyInheritance(source.copyPolicy, copyPolicy);
    }

    await tx.update(decks).set({ copyPolicy, updatedAt: new Date() }).where(eq(decks.id, deckId));
    await tx.insert(deckAuditEvents).values({
      deckId,
      actorId,
      eventType: 'deck.copy_policy_changed',
      metadata: { copyPolicy },
    });
  });
}

export async function reportDeck(
  deckId: number,
  reporterId: string,
  reason: string,
  details?: string,
) {
  await db.transaction(async tx => {
    const [deck] = await tx
      .select({ id: decks.id })
      .from(decks)
      .leftJoin(
        deckFollows,
        and(eq(deckFollows.deckId, decks.id), eq(deckFollows.userId, reporterId)),
      )
      .where(
        and(
          eq(decks.id, deckId),
          ne(decks.status, 'moderation_removed'),
          or(
            eq(decks.ownerId, reporterId),
            and(ne(decks.visibility, 'private'), eq(decks.status, 'active')),
            or(eq(deckFollows.status, 'active'), eq(deckFollows.status, 'frozen')),
          ),
        ),
      )
      .limit(1);
    if (!deck) {
      throw new DeckDomainError('DECK_INACCESSIBLE', 'Deck not found or inaccessible.');
    }

    await tx
      .insert(deckReports)
      .values({ deckId, reporterId, reason, details })
      .onConflictDoUpdate({
        target: [deckReports.reporterId, deckReports.deckId],
        set: { reason, details, createdAt: new Date() },
      });
    await tx.insert(deckAuditEvents).values({
      deckId,
      actorId: reporterId,
      eventType: 'deck.reported',
      metadata: { reason },
    });
  });
}

export async function moderateRemoveDeck(
  deckId: number,
  moderatorId: string,
  moderatorAuthorized: boolean,
) {
  if (!moderatorAuthorized) {
    throw new DeckDomainError('MODERATOR_REQUIRED', 'Moderator access is required.');
  }

  await db.transaction(async tx => {
    const [deck] = await tx
      .select({ id: decks.id })
      .from(decks)
      .where(eq(decks.id, deckId))
      .for('update')
      .limit(1);
    if (!deck) throw new DeckDomainError('DECK_NOT_FOUND', 'Deck not found.');

    await tx
      .update(decks)
      .set({ status: 'moderation_removed', catalogStatus: 'hidden', updatedAt: new Date() })
      .where(eq(decks.id, deckId));
    await tx.update(deckFollows).set({ status: 'frozen' }).where(eq(deckFollows.deckId, deckId));
    await tx.insert(deckAuditEvents).values({
      deckId,
      actorId: moderatorId,
      eventType: 'deck.moderation_removed',
    });
  });
}

export async function setDeckUnderReview(
  deckId: number,
  moderatorId: string,
  moderatorAuthorized: boolean,
) {
  if (!moderatorAuthorized) {
    throw new DeckDomainError('MODERATOR_REQUIRED', 'Moderator access is required.');
  }

  await db.transaction(async tx => {
    const updated = await tx
      .update(decks)
      .set({ catalogStatus: 'under_review', updatedAt: new Date() })
      .where(eq(decks.id, deckId))
      .returning({ id: decks.id });
    if (!updated.length) throw new DeckDomainError('DECK_NOT_FOUND', 'Deck not found.');
    await tx.insert(deckAuditEvents).values({
      deckId,
      actorId: moderatorId,
      eventType: 'deck.under_review',
    });
  });
}

export async function restrictedHardDeleteDeck(deckId: number, actorId: string): Promise<boolean> {
  return db.transaction(async tx => {
    const [deck] = await tx
      .select()
      .from(decks)
      .where(and(eq(decks.id, deckId), eq(decks.ownerId, actorId)))
      .for('update')
      .limit(1);
    if (!deck || deck.status !== 'deleted') {
      throw new DeckDomainError(
        'HARD_DELETE_FORBIDDEN',
        'The deck is not eligible for hard deletion.',
      );
    }

    const [followers] = await tx
      .select({ value: count(deckFollows.id) })
      .from(deckFollows)
      .where(
        and(
          eq(deckFollows.deckId, deckId),
          or(eq(deckFollows.status, 'active'), eq(deckFollows.status, 'frozen')),
        ),
      );
    if (!canFinalizeDeckDeletion(Number(followers.value), deck.retentionUntil)) {
      throw new DeckDomainError(
        'HARD_DELETE_FORBIDDEN',
        'The deck is not eligible for hard deletion.',
      );
    }

    const dependencies = await tx.execute(sql`
      select (
        (select count(*) from deck_releases where deck_id=${deckId}) +
        (select count(*) from deck_follows where deck_id=${deckId}) +
        (select count(*) from decks where id <> ${deckId} and (source_deck_id=${deckId} or root_deck_id=${deckId})) +
        (select count(*) from deck_audit_events where deck_id=${deckId})
      )::int as value
    `);
    if (Number(dependencies[0].value) > 0) {
      await tx
        .update(decks)
        .set({
          ownerId: '00000000-0000-0000-0000-000000000000',
          title: '[deleted deck]',
          description: null,
          frontLanguage: null,
          backLanguage: null,
          visibility: 'private',
          catalogStatus: 'hidden',
          retentionUntil: null,
          updatedAt: new Date(),
        })
        .where(eq(decks.id, deckId));
      return false;
    }

    await tx.delete(decks).where(eq(decks.id, deckId));
    return true;
  });
}
