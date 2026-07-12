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
import { eq, and, getTableColumns, count, sql, or, ne, inArray } from 'drizzle-orm';
import { getNewVocabCountForDeck } from '@/db/queries/review.queries';
import {
  activeReleaseIdExpression,
  deckMetadataAccess,
  studyDeckAccess,
  viewDeckAccess,
} from '@/db/queries/deck-access';
import { DeckDomainError } from '@/lib/deck-domain';
import { DECK_LIMITS } from '@/config/deck-limits';

export const createDeck = async (deck: CreateDeck) => {
  await db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${deck.ownerId}))`);
    const [owned] = await tx
      .select({ value: count(decks.id) })
      .from(decks)
      .where(and(eq(decks.ownerId, deck.ownerId), eq(decks.status, 'active')));
    if (Number(owned.value) >= DECK_LIMITS.activeOwnedDecks) {
      throw new DeckDomainError('DECK_QUOTA', 'Active deck limit reached.');
    }
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
    .select()
    .from(decks)
    .where(and(eq(decks.ownerId, ownerId), eq(decks.status, 'active')));
};

export const getRestorableDecksByOwnerId = async (ownerId: string) => {
  return db
    .select()
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

export const getPublicDecks = async (userId: string) => {
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
        ne(decks.ownerId, userId),
      ),
    );
};

export type DiscoverableDeck = Awaited<ReturnType<typeof getPublicDecks>>[number];

export const getDeckById = async (deckId: number): Promise<Deck | undefined> => {
  return (await db.select().from(decks).where(eq(decks.id, deckId)).limit(1))[0];
};

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
        newWordsAvailable: sql<number>`0`,
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
    ...toReviewCounts(result),
    newWordsAvailable,
  };
}

export async function getAllDecksStudyCounts(
  userId: string,
  activeDeckIds?: number[],
): Promise<ReviewCounts> {
  const deckIds = activeDeckIds ?? (await getUserActiveDecks(userId)).map(deck => deck.id);
  if (deckIds.length === 0) {
    return toReviewCounts();
  }

  const [result] = await db
    .select({
      totalWords: count(vocabs.id),
      newWordsAvailable: sql<number>`0`,
      reviewsDue: sql<number>`
        count(${userVocabState.id}) filter (
          where ${userVocabState.dueAt} <= date_trunc('hour', now())
        )
      `,
      wordsInReview: count(userVocabState.id),
    })
    .from(vocabs)
    .innerJoin(lessons, eq(vocabs.lessonId, lessons.id))
    .innerJoin(decks, eq(lessons.deckId, decks.id))
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
    .where(inArray(decks.id, deckIds));

  const availableCounts = await Promise.all(
    deckIds.map(deckId => getNewVocabCountForDeck(deckId, userId)),
  );

  return {
    ...toReviewCounts(result),
    newWordsAvailable: availableCounts.reduce((total, available) => total + available, 0),
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

function toReviewCounts(result?: ReviewCounts): ReviewCounts {
  if (!result) {
    return {
      totalWords: 0,
      newWordsAvailable: 0,
      reviewsDue: 0,
      wordsInReview: 0,
    };
  }

  return {
    totalWords: Number(result.totalWords),
    newWordsAvailable: Number(result.newWordsAvailable),
    reviewsDue: Number(result.reviewsDue),
    wordsInReview: Number(result.wordsInReview),
  };
}
