import { db } from '@/db';
import { decks, deckSubscriptions, lessons, userVocabState, vocabs } from '@/db/schema';
import { CreateDeck, Deck } from '@/types/deck.types';
import { ReviewCounts } from '@/types/review.types';
import {
  eq,
  and,
  getTableColumns,
  count,
  sql,
  or,
  isNull,
  isNotNull,
  notExists,
  ne,
  inArray,
} from 'drizzle-orm';
import { getNewVocabCountForDeck } from '@/db/queries/review.queries';

export const createDeck = async (deck: CreateDeck) => {
  await db.insert(decks).values({
    title: deck.title,
    ownerId: deck.ownerId,
    description: deck.description,
    visibility: deck.visibility,
  });
};

export const getDecksByOwnerId = async (ownerId: string) => {
  return db
    .select()
    .from(decks)
    .where(and(eq(decks.ownerId, ownerId), isNull(decks.deletedAt)));
};

export const getUserSubscribedDecks = async (userId: string) => {
  return db
    .selectDistinct({ ...getTableColumns(decks) })
    .from(decks)
    .innerJoin(deckSubscriptions, eq(deckSubscriptions.deckId, decks.id))
    .where(eq(deckSubscriptions.userId, userId));
};

export const getUserActiveDecks = async (userId: string): Promise<Deck[]> => {
  return db
    .selectDistinct({ ...getTableColumns(decks) })
    .from(decks)
    .leftJoin(
      deckSubscriptions,
      and(eq(deckSubscriptions.deckId, decks.id), eq(deckSubscriptions.userId, userId)),
    )
    .leftJoin(lessons, eq(lessons.deckId, decks.id))
    .leftJoin(vocabs, eq(vocabs.lessonId, lessons.id))
    .leftJoin(
      userVocabState,
      and(eq(userVocabState.vocabId, vocabs.id), eq(userVocabState.userId, userId)),
    )
    .where(
      or(
        eq(deckSubscriptions.userId, userId),
        and(eq(decks.ownerId, userId), isNull(decks.deletedAt), isNotNull(userVocabState.id)),
      ),
    );
};

export const getPublicDecks = async (userId: string): Promise<Deck[]> => {
  return db
    .select()
    .from(decks)
    .where(and(eq(decks.visibility, 'public'), isNull(decks.deletedAt), ne(decks.ownerId, userId)));
};

export const getDeckById = async (deckId: number): Promise<Deck | undefined> => {
  return (await db.select().from(decks).where(eq(decks.id, deckId)).limit(1))[0];
};

export const getAccessibleDeckById = async (
  deckId: number,
  userId: string,
): Promise<Deck | undefined> => {
  return (
    await db
      .selectDistinct({ ...getTableColumns(decks) })
      .from(decks)
      .leftJoin(
        deckSubscriptions,
        and(eq(deckSubscriptions.deckId, decks.id), eq(deckSubscriptions.userId, userId)),
      )
      .where(
        and(
          eq(decks.id, deckId),
          or(
            and(isNull(decks.deletedAt), eq(decks.visibility, 'public')),
            and(isNull(decks.deletedAt), eq(decks.ownerId, userId)),
            eq(deckSubscriptions.userId, userId),
          ),
        ),
      )
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
      .where(and(eq(decks.id, deckId), eq(decks.ownerId, userId), isNull(decks.deletedAt)))
      .limit(1)
  )[0];
};

export const deleteDeck = async (deckId: number, userId: string) => {
  await db.transaction(async tx => {
    const deletedAt = new Date();

    const archivedDecks = await tx
      .update(decks)
      .set({ deletedAt, updatedAt: deletedAt })
      .where(and(eq(decks.id, deckId), eq(decks.ownerId, userId), isNull(decks.deletedAt)))
      .returning({ id: decks.id });

    if (archivedDecks.length === 0) {
      throw new Error('Deck not found or access denied');
    }

    await tx
      .delete(decks)
      .where(
        and(
          eq(decks.id, deckId),
          notExists(
            tx
              .select({ id: deckSubscriptions.id })
              .from(deckSubscriptions)
              .where(eq(deckSubscriptions.deckId, deckId)),
          ),
        ),
      );
  });
};

export async function getDeckStudyCounts(deckId: number, userId: string): Promise<ReviewCounts> {
  const [[result], newWordsAvailable] = await Promise.all([
    db
      .select({
        totalWords: count(vocabs.id),
        newWordsAvailable: sql<number>`0`,
        reviewsDue: sql<number>`
          count(${userVocabState.id}) filter (
            where ${userVocabState.dueAt} <= now()
          )
        `,
        wordsInReview: count(userVocabState.id),
      })
      .from(vocabs)
      .innerJoin(lessons, eq(vocabs.lessonId, lessons.id))
      .innerJoin(decks, eq(lessons.deckId, decks.id))
      .leftJoin(
        deckSubscriptions,
        and(eq(deckSubscriptions.deckId, decks.id), eq(deckSubscriptions.userId, userId)),
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
          where ${userVocabState.dueAt} <= now()
        )
      `,
      wordsInReview: count(userVocabState.id),
    })
    .from(vocabs)
    .innerJoin(lessons, eq(vocabs.lessonId, lessons.id))
    .innerJoin(decks, eq(lessons.deckId, decks.id))
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
): Promise<Record<number, Pick<ReviewCounts, 'totalWords' | 'reviewsDue'>>> {
  if (deckIds.length === 0) return {};

  const rows = await db
    .select({
      deckId: decks.id,
      totalWords: count(vocabs.id),
      reviewsDue: sql<number>`
        count(${userVocabState.id}) filter (
          where ${userVocabState.dueAt} <= now()
        )
      `,
    })
    .from(decks)
    .innerJoin(lessons, eq(lessons.deckId, decks.id))
    .innerJoin(vocabs, eq(vocabs.lessonId, lessons.id))
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
      },
    ]),
  );
}

function studyDeckAccess(userId: string) {
  return or(
    and(eq(decks.ownerId, userId), isNull(decks.deletedAt)),
    eq(deckSubscriptions.userId, userId),
  );
}

function viewDeckAccess(userId: string) {
  return or(and(isNull(decks.deletedAt), eq(decks.visibility, 'public')), studyDeckAccess(userId));
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
