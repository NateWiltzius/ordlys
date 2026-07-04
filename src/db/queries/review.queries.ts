import { and, eq, isNull, lte, or } from 'drizzle-orm';
import { db } from '@/db';
import { deckSubscriptions, decks, lessons, vocabs, userVocabState } from '@/db/schema';
import { getInitialSrsState, getNextSrsState } from '@/lib/srs/srs-scheduler';

export async function getNewVocabsForDeck(deckId: number, userId: string, limit = 5) {
  return db
    .select({
      id: vocabs.id,
      front: vocabs.front,
      back: vocabs.back,
      frontAlternatives: vocabs.frontAlternatives,
      backAlternatives: vocabs.backAlternatives,
      reading: vocabs.reading,
      lessonId: vocabs.lessonId,
      lessonTitle: lessons.title,
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
        isNull(userVocabState.id),
      ),
    )
    .orderBy(lessons.orderIndex, vocabs.orderIndex, vocabs.id)
    .limit(limit);
}

export async function getDueReviewsForDeck(deckId: number, userId: string) {
  const now = new Date();

  return db
    .select({
      id: vocabs.id,
      front: vocabs.front,
      back: vocabs.back,
      frontAlternatives: vocabs.frontAlternatives,
      backAlternatives: vocabs.backAlternatives,
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
    .leftJoin(
      deckSubscriptions,
      and(eq(deckSubscriptions.deckId, decks.id), eq(deckSubscriptions.userId, userId)),
    )
    .where(
      and(
        eq(userVocabState.userId, userId),
        eq(decks.id, deckId),
        or(eq(decks.ownerId, userId), eq(deckSubscriptions.userId, userId)),
        lte(userVocabState.dueAt, now),
      ),
    )
    .orderBy(userVocabState.dueAt);
}

export async function startVocab(vocabId: number, userId: string) {
  const now = new Date();
  const initialSrsState = getInitialSrsState(now);

  const [vocabAccess] = await db
    .select({ id: vocabs.id })
    .from(vocabs)
    .innerJoin(lessons, eq(vocabs.lessonId, lessons.id))
    .innerJoin(decks, eq(lessons.deckId, decks.id))
    .leftJoin(
      deckSubscriptions,
      and(eq(deckSubscriptions.deckId, decks.id), eq(deckSubscriptions.userId, userId)),
    )
    .where(
      and(
        eq(vocabs.id, vocabId),
        or(eq(decks.ownerId, userId), eq(deckSubscriptions.userId, userId)),
      ),
    )
    .limit(1);

  if (!vocabAccess) {
    throw new Error('Vocab not found or access denied');
  }

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
    .innerJoin(vocabs, eq(userVocabState.vocabId, vocabs.id))
    .innerJoin(lessons, eq(vocabs.lessonId, lessons.id))
    .innerJoin(decks, eq(lessons.deckId, decks.id))
    .leftJoin(
      deckSubscriptions,
      and(eq(deckSubscriptions.deckId, decks.id), eq(deckSubscriptions.userId, userId)),
    )
    .where(
      and(
        eq(userVocabState.vocabId, vocabId),
        eq(userVocabState.userId, userId),
        or(eq(decks.ownerId, userId), eq(deckSubscriptions.userId, userId)),
      ),
    )
    .limit(1);

  if (!state) {
    throw new Error('User vocab state not found or access denied');
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
