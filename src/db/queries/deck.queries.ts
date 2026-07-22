import { db } from '@/db';
import {
  deckAuditEvents,
  deckFollows,
  deckReleases,
  decks,
  lessons,
  releaseVocabs,
  userVocabState,
  vocabs,
} from '@/db/schema';
import { CreateDeck, Deck } from '@/types/deck.types';
import { ReviewCounts } from '@/types/review.types';
import { eq, and, getTableColumns, count, sql, or, inArray } from 'drizzle-orm';
import { getNewVocabCountForDeck } from '@/db/queries/review.queries';
import {
  activeReleaseIdExpression,
  deckMetadataAccess,
  studyDeckAccess,
  viewDeckAccess,
} from '@/db/queries/deck-access';
import { assertAuthoringCapacity } from '@/lib/authoring-quota';
import { getAuthoringUsage, lockAuthoringAccount } from '@/db/queries/authoring-quota.queries';

export const createDeck = async (deck: CreateDeck) => {
  return db.transaction(async tx => {
    await lockAuthoringAccount(tx, deck.ownerId);
    assertAuthoringCapacity(await getAuthoringUsage(tx, deck.ownerId), { activeDecks: 1 });
    const [created] = await tx
      .insert(decks)
      .values({
        title: deck.title,
        ownerId: deck.ownerId,
        description: deck.description,
        frontLanguage: deck.frontLanguage,
        backLanguage: deck.backLanguage,
        visibility: 'private',
      })
      .returning({ id: decks.id });
    await tx.update(decks).set({ rootDeckId: created.id }).where(eq(decks.id, created.id));
    await tx.insert(deckAuditEvents).values({
      deckId: created.id,
      actorId: deck.ownerId,
      eventType: 'deck.created',
    });
    return created.id;
  });
};

export const updateDeck = async (
  deckId: number,
  userId: string,
  deck: Pick<CreateDeck, 'title' | 'description' | 'frontLanguage' | 'backLanguage'>,
) => {
  const updated = await db
    .update(decks)
    .set({ ...deck, updatedAt: new Date() })
    .where(and(eq(decks.id, deckId), eq(decks.ownerId, userId), eq(decks.status, 'active')))
    .returning({ id: decks.id });
  if (!updated.length) throw new Error('Deck not found or access denied.');
};

export const getDecksByOwnerId = async (ownerId: string) => {
  return db
    .select({
      ...getTableColumns(decks),
      subscriberCount: sql<number>`(
        select count(*)::int
        from ${deckFollows} follows
        where follows.deck_id = ${decks.id} and follows.status = 'active'
      )`,
    })
    .from(decks)
    .where(and(eq(decks.ownerId, ownerId), eq(decks.status, 'active')));
};

export const getRestorableDecksByOwnerId = async (ownerId: string) => {
  return db
    .select({
      ...getTableColumns(decks),
      subscriberCount: sql<number>`(
        select count(*)::int
        from ${deckFollows} follows
        where follows.deck_id = ${decks.id} and follows.status = 'active'
      )`,
    })
    .from(decks)
    .where(
      and(
        eq(decks.ownerId, ownerId),
        or(eq(decks.status, 'archived'), eq(decks.status, 'deleted')),
      ),
    );
};

export const getUserFollowedDecks = async (userId: string) => {
  return db
    .selectDistinct({
      ...getTableColumns(decks),
      title: sql<string>`coalesce((select title from deck_releases where id=${activeReleaseIdExpression(userId, false)}), ${decks.title})`,
      description: sql<
        string | null
      >`(select description from deck_releases where id=${activeReleaseIdExpression(userId, false)})`,
      copyPolicy: sql<
        Deck['copyPolicy']
      >`(select copy_policy from deck_releases where id=${activeReleaseIdExpression(userId, false)})`,
      subscriberCount: sql<number>`(
        select count(*)::int
        from ${deckFollows} followers
        where followers.deck_id = ${decks.id} and followers.status = 'active'
      )`,
    })
    .from(decks)
    .innerJoin(deckFollows, eq(deckFollows.deckId, decks.id))
    .where(
      and(
        eq(deckFollows.userId, userId),
        or(eq(deckFollows.status, 'active'), eq(deckFollows.status, 'frozen')),
      ),
    );
};

export type LibraryDeck = Awaited<ReturnType<typeof getDecksByOwnerId>>[number];

export const getUserActiveDecks = async (userId: string): Promise<Deck[]> => {
  return db
    .selectDistinct({
      ...getTableColumns(decks),
      title: sql<string>`case when ${decks.ownerId}=${userId} then ${decks.title} else coalesce((select title from deck_releases where id=${activeReleaseIdExpression(userId, false)}), ${decks.title}) end`,
      description: sql<
        string | null
      >`case when ${decks.ownerId}=${userId} then ${decks.description} else (select description from deck_releases where id=${activeReleaseIdExpression(userId, false)}) end`,
      copyPolicy: sql<
        Deck['copyPolicy']
      >`case when ${decks.ownerId}=${userId} then ${decks.copyPolicy} else (select copy_policy from deck_releases where id=${activeReleaseIdExpression(userId, false)}) end`,
    })
    .from(decks)
    .innerJoin(
      deckFollows,
      and(
        eq(deckFollows.deckId, decks.id),
        eq(deckFollows.userId, userId),
        or(eq(deckFollows.status, 'active'), eq(deckFollows.status, 'frozen')),
      ),
    )
    .where(eq(deckFollows.userId, userId));
};

export const getPublicDecks = async () => {
  return db
    .select({
      ...getTableColumns(decks),
      title: deckReleases.title,
      description: deckReleases.description,
      copyPolicy: deckReleases.copyPolicy,
      subscriberCount: sql<number>`(
        select count(*)::int
        from ${deckFollows} follows
        where follows.deck_id = ${decks.id} and follows.status = 'active'
      )`,
    })
    .from(decks)
    .innerJoin(deckReleases, eq(deckReleases.id, decks.currentReleaseId))
    .where(
      and(
        eq(decks.visibility, 'public'),
        eq(decks.status, 'active'),
        eq(decks.catalogStatus, 'eligible'),
      ),
    );
};

export type DiscoverableDeck = Awaited<ReturnType<typeof getPublicDecks>>[number];

export const getAccessibleDeckById = async (
  deckId: number,
  userId: string,
): Promise<Deck | undefined> => {
  return (
    await db
      .selectDistinct({
        ...getTableColumns(decks),
        title: sql<string>`case when ${decks.ownerId}=${userId} then ${decks.title} else coalesce((select title from deck_releases where id=${activeReleaseIdExpression(userId, true)}), ${decks.title}) end`,
        description: sql<
          string | null
        >`case when ${decks.ownerId}=${userId} then ${decks.description} else (select description from deck_releases where id=${activeReleaseIdExpression(userId, true)}) end`,
        copyPolicy: sql<
          Deck['copyPolicy']
        >`case when ${decks.ownerId}=${userId} then ${decks.copyPolicy} else (select copy_policy from deck_releases where id=${activeReleaseIdExpression(userId, true)}) end`,
      })
      .from(decks)
      .leftJoin(
        deckFollows,
        and(
          eq(deckFollows.deckId, decks.id),
          eq(deckFollows.userId, userId),
          or(eq(deckFollows.status, 'active'), eq(deckFollows.status, 'frozen')),
        ),
      )
      .where(and(eq(decks.id, deckId), deckMetadataAccess(userId)))
      .limit(1)
  )[0];
};

export const getOwnedDeckById = async (
  deckId: number,
  userId: string,
): Promise<Deck | undefined> => {
  return (
    await db
      .select()
      .from(decks)
      .where(and(eq(decks.id, deckId), eq(decks.ownerId, userId), eq(decks.status, 'active')))
      .limit(1)
  )[0];
};

export async function getDeckStudyCounts(deckId: number, userId: string): Promise<ReviewCounts> {
  const [[result], newWordsAvailable] = await Promise.all([
    db
      .select({
        totalWords: count(vocabs.id),
        reviewsDue: sql<number>`
          count(${userVocabState.id}) filter (
            where ${userVocabState.dueAt} <= date_trunc('hour', now())
              and ${studyDeckAccess(userId)}
          )
        `,
        wordsInReview: sql<number>`
          count(${userVocabState.id}) filter (where ${studyDeckAccess(userId)})
        `,
      })
      .from(vocabs)
      .innerJoin(lessons, eq(vocabs.lessonId, lessons.id))
      .innerJoin(decks, eq(lessons.deckId, decks.id))
      .innerJoin(
        releaseVocabs,
        and(
          eq(releaseVocabs.vocabId, vocabs.id),
          eq(releaseVocabs.releaseId, activeReleaseIdExpression(userId, true)),
        ),
      )
      .leftJoin(
        userVocabState,
        and(eq(userVocabState.vocabId, vocabs.id), eq(userVocabState.userId, userId)),
      )
      .where(and(eq(decks.id, deckId), viewDeckAccess(userId))),
    getNewVocabCountForDeck(deckId, userId),
  ]);

  return {
    ...toStudyCounts(result),
    newWordsAvailable,
  };
}

export async function getDeckCardStudyCounts(
  deckIds: number[],
  userId: string,
): Promise<Record<number, Pick<ReviewCounts, 'totalWords' | 'reviewsDue' | 'wordsInReview'>>> {
  if (deckIds.length === 0) return {};

  const rows = await db
    .select({
      deckId: decks.id,
      totalWords: count(vocabs.id),
      reviewsDue: sql<number>`
        count(${userVocabState.id}) filter (
          where ${userVocabState.dueAt} <= date_trunc('hour', now())
        )
      `,
      wordsInReview: count(userVocabState.id),
    })
    .from(decks)
    .innerJoin(lessons, eq(lessons.deckId, decks.id))
    .innerJoin(vocabs, eq(vocabs.lessonId, lessons.id))
    .innerJoin(
      releaseVocabs,
      and(
        eq(releaseVocabs.vocabId, vocabs.id),
        eq(releaseVocabs.releaseId, activeReleaseIdExpression(userId, false)),
      ),
    )
    .leftJoin(
      userVocabState,
      and(eq(userVocabState.vocabId, vocabs.id), eq(userVocabState.userId, userId)),
    )
    .where(inArray(decks.id, deckIds))
    .groupBy(decks.id);

  return Object.fromEntries(
    rows.map(row => [
      row.deckId,
      {
        totalWords: Number(row.totalWords),
        reviewsDue: Number(row.reviewsDue),
        wordsInReview: Number(row.wordsInReview),
      },
    ]),
  );
}

type StudyCounts = Pick<ReviewCounts, 'totalWords' | 'reviewsDue' | 'wordsInReview'>;

function toStudyCounts(result?: StudyCounts): StudyCounts {
  if (!result) {
    return {
      totalWords: 0,
      reviewsDue: 0,
      wordsInReview: 0,
    };
  }

  return {
    totalWords: Number(result.totalWords),
    reviewsDue: Number(result.reviewsDue),
    wordsInReview: Number(result.wordsInReview),
  };
}
