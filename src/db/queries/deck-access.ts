import { deckFollows, deckReleases, decks, lessons, vocabs } from '../schema';
import { and, eq, ne, or, sql } from 'drizzle-orm';
import { resolveAccessibleReleaseId } from '../../lib/deck-access-policy';

export function activeReleaseIdExpression(userId: string, allowPublic: boolean) {
  // SQL counterpart to resolveAccessibleReleaseId. Policy tests cover this precedence order.
  const ownerFallback = allowPublic
    ? sql`when ${decks.ownerId} = ${userId} and ${decks.status} <> 'moderation_removed' then ${decks.currentReleaseId}`
    : sql``;
  const publicFallback = allowPublic
    ? sql`when ${decks.visibility} in ('public', 'unlisted') and ${decks.status} = 'active' then ${decks.currentReleaseId}`
    : sql``;
  return sql<number>`(
    case
      ${ownerFallback}
      when ${decks.status} <> 'moderation_removed' and exists (
        select 1 from deck_follows df
        where df.deck_id = ${decks.id} and df.user_id = ${userId}
          and df.status in ('active', 'frozen')
      ) then (
        select case
          when df.update_mode = 'manual' then coalesce(df.pinned_release_id, df.last_seen_release_id)
          when df.status = 'frozen' then df.last_seen_release_id
          else ${decks.currentReleaseId}
        end
        from deck_follows df
        where df.deck_id = ${decks.id} and df.user_id = ${userId}
        limit 1
      )
      ${publicFallback}
      else null
    end
  )`;
}

/**
 * SQL counterpart to canAccessRelease in lib/deck-access-policy.ts.
 * The query must join deckReleases -> decks and left-join the requesting user's deckFollows row.
 */
export function accessibleReleaseCondition(userId: string, allowPublicCurrent: boolean) {
  const publicCurrent = allowPublicCurrent
    ? and(
        eq(decks.status, 'active'),
        ne(decks.visibility, 'private'),
        eq(deckReleases.id, decks.currentReleaseId),
      )
    : undefined;

  return and(
    ne(decks.status, 'moderation_removed'),
    or(
      eq(decks.ownerId, userId),
      or(eq(deckFollows.status, 'active'), eq(deckFollows.status, 'frozen')),
      publicCurrent,
    ),
  );
}

function releaseContentAccess(userId: string, allowPublic: boolean) {
  const releaseId = activeReleaseIdExpression(userId, allowPublic);
  return sql<boolean>`
    ${releaseId} is not null
    and exists (
      select 1 from release_lessons rl
      where rl.release_id = ${releaseId} and rl.lesson_id = ${lessons.id}
    )
    and (
      ${vocabs.id} is null or exists (
        select 1 from release_vocabs rv
        where rv.release_id = ${releaseId} and rv.vocab_id = ${vocabs.id}
      )
    )
  `;
}

export function studyDeckAccess(userId: string) {
  return releaseContentAccess(userId, false);
}

export function viewDeckAccess(userId: string) {
  return releaseContentAccess(userId, true);
}

export function deckMetadataAccess(userId: string) {
  return or(
    and(eq(decks.ownerId, userId), ne(decks.status, 'moderation_removed')),
    and(ne(decks.visibility, 'private'), eq(decks.status, 'active')),
    and(
      ne(decks.status, 'moderation_removed'),
      sql<boolean>`exists (
        select 1 from deck_follows df where df.deck_id = ${decks.id}
        and df.user_id = ${userId} and df.status in ('active', 'frozen')
      )`,
    ),
  );
}

export async function getActiveReleaseId(
  deckId: number,
  userId: string,
  allowPublic = false,
): Promise<number | null> {
  const { db } = await import('..');
  const [deck] = await db
    .select({
      ownerId: decks.ownerId,
      status: decks.status,
      visibility: decks.visibility,
      currentReleaseId: decks.currentReleaseId,
    })
    .from(decks)
    .where(eq(decks.id, deckId))
    .limit(1);
  if (!deck) return null;

  const [follow] = await db
    .select()
    .from(deckFollows)
    .where(and(eq(deckFollows.deckId, deckId), eq(deckFollows.userId, userId)))
    .limit(1);
  return resolveAccessibleReleaseId({ deck, follow, userId, allowPublic });
}
