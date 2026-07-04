import { db } from '@/db';
import { decks, deckSubscriptions, lessons, userVocabState, vocabs } from '@/db/schema';
import { CreateDeck, Deck } from '@/types/deck.types';
import { ReviewCounts } from '@/types/review.types';
import { eq, and, getTableColumns, count, sql, or } from 'drizzle-orm';

export const createDeck = async (deck: CreateDeck) => {
  await db.insert(decks).values({
    title: deck.title,
    ownerId: deck.ownerId,
    description: deck.description,
    visibility: deck.visibility,
  });
};

export const getDecksByOwnerId = async (ownerId: string) => {
  return db.select().from(decks).where(eq(decks.ownerId, ownerId));
};

export const getUserSubscribedDecks = async (userId: string) => {
  return db
    .selectDistinct({ ...getTableColumns(decks) })
    .from(decks)
    .innerJoin(deckSubscriptions, eq(deckSubscriptions.deckId, decks.id))
    .where(eq(deckSubscriptions.userId, userId));
};

export const getPublicDecks = async (): Promise<Deck[]> => {
  return db.select().from(decks).where(eq(decks.visibility, 'public'));
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
            eq(decks.visibility, 'public'),
            eq(decks.ownerId, userId),
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
      .where(and(eq(decks.id, deckId), eq(decks.ownerId, userId)))
      .limit(1)
  )[0];
};

export const deleteDeck = async (deckId: number, userId: string) => {
  await db.delete(decks).where(and(eq(decks.id, deckId), eq(decks.ownerId, userId)));
};

export async function getDeckStudyCounts(deckId: number, userId: string): Promise<ReviewCounts> {
  const [result] = await db
    .select({
      totalWords: count(vocabs.id),
      newWordsAvailable: sql<number>`
        ${count(vocabs.id)} - ${count(userVocabState.id)}
      `,
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
    .where(
      and(
        eq(decks.id, deckId),
        or(eq(decks.ownerId, userId), eq(deckSubscriptions.userId, userId)),
      ),
    );

  return toReviewCounts(result);
}

export async function getAllDecksStudyCounts(userId: string): Promise<ReviewCounts> {
  const [result] = await db
    .select({
      totalWords: count(vocabs.id),
      newWordsAvailable: sql<number>`
        ${count(vocabs.id)} - ${count(userVocabState.id)}
      `,
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
    .where(or(eq(decks.ownerId, userId), eq(deckSubscriptions.userId, userId)));

  return toReviewCounts(result);
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
