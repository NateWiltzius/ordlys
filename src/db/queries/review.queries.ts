import { and, eq, isNull, lte } from 'drizzle-orm';
import { db } from '@/db';
import { decks, lessons, vocabs, userVocabState } from '@/db/schema';
import { getInitialSrsState, getNextSrsState } from '@/lib/srs/srs-scheduler';

export async function getNewVocabsForDeck(deckId: number, userId: string, limit = 5) {
  return db
    .select({
      id: vocabs.id,
      front: vocabs.front,
      back: vocabs.back,
      reading: vocabs.reading,
      lessonId: vocabs.lessonId,
      lessonTitle: lessons.title,
    })
    .from(vocabs)
    .innerJoin(lessons, eq(vocabs.lessonId, lessons.id))
    .innerJoin(decks, eq(lessons.deckId, decks.id))
    .leftJoin(
      userVocabState,
      and(eq(userVocabState.vocabId, vocabs.id), eq(userVocabState.userId, userId)),
    )
    .where(and(eq(decks.id, deckId), eq(decks.ownerId, userId), isNull(userVocabState.id)))
    .orderBy(lessons.orderIndex, vocabs.orderIndex, vocabs.id)
    .limit(limit);
}

export async function getDueReviewsForDeck(deckId: number, userId: string) {
  return db
    .select({
      id: vocabs.id,
      front: vocabs.front,
      back: vocabs.back,
      reading: vocabs.reading,
      lessonId: vocabs.lessonId,
      lessonTitle: lessons.title,

      stateId: userVocabState.id,
      srsLevel: userVocabState.srsLevel,
    })
    .from(userVocabState)
    .innerJoin(vocabs, eq(userVocabState.vocabId, vocabs.id))
    .innerJoin(lessons, eq(vocabs.lessonId, lessons.id))
    .innerJoin(decks, eq(lessons.deckId, decks.id))
    .where(
      and(eq(decks.id, deckId), eq(decks.ownerId, userId), lte(userVocabState.dueAt, new Date())),
    )
    .orderBy(userVocabState.dueAt);
}

export async function startVocab(vocabId: number, userId: string) {
  const now = new Date();
  const initialSrsState = getInitialSrsState(now);

  await db
    .insert(userVocabState)
    .values({
      userId,
      vocabId,
      dueAt: initialSrsState.dueAt,
      srsLevel: initialSrsState.srsLevel,
    })
    .onConflictDoNothing({
      target: [userVocabState.userId, userVocabState.vocabId],
    });
}

export async function reviewVocab(vocabId: number, userId: string, wasCorrect: boolean) {
  const now = new Date();

  const [state] = await db
    .select({
      srsLevel: userVocabState.srsLevel,
    })
    .from(userVocabState)
    .where(and(eq(userVocabState.vocabId, vocabId), eq(userVocabState.userId, userId)));

  if (!state) {
    throw new Error('User vocab state not found');
  }

  const nextSrsState = getNextSrsState({
    currentSrsLevel: state.srsLevel,
    wasCorrect,
    now,
  });

  await db
    .update(userVocabState)
    .set({
      srsLevel: nextSrsState.srsLevel,
      dueAt: nextSrsState.dueAt,
      updatedAt: now,
    })
    .where(and(eq(userVocabState.vocabId, vocabId), eq(userVocabState.userId, userId)));
}
