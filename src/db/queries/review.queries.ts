import { and, count, eq, inArray, isNull, lte, or, sql } from 'drizzle-orm';
import { db } from '@/db';
import { deckSubscriptions, decks, lessons, vocabs, userVocabState } from '@/db/schema';
import { getInitialSrsState, getNextSrsState } from '@/lib/srs/srs-scheduler';
import { LESSON_PROGRESSION_CONFIG } from '@/lib/srs/srs-config';
import type { LessonProgress } from '@/types/review.types';

export async function getLessonProgressForDeck(
  deckId: number,
  userId: string,
): Promise<LessonProgress[]> {
  const rows = await db
    .select({
      lessonId: lessons.id,
      lessonTitle: lessons.title,
      totalWords: count(vocabs.id),
      learnedWords: count(userVocabState.id),
      masteredWords: sql<number>`
        count(${userVocabState.id}) filter (
          where ${userVocabState.srsLevel} >= ${LESSON_PROGRESSION_CONFIG.unlockSrsLevel}
        )
      `,
    })
    .from(lessons)
    .innerJoin(decks, eq(lessons.deckId, decks.id))
    .leftJoin(
      deckSubscriptions,
      and(eq(deckSubscriptions.deckId, decks.id), eq(deckSubscriptions.userId, userId)),
    )
    .leftJoin(vocabs, eq(vocabs.lessonId, lessons.id))
    .leftJoin(
      userVocabState,
      and(eq(userVocabState.vocabId, vocabs.id), eq(userVocabState.userId, userId)),
    )
    .where(and(eq(decks.id, deckId), viewDeckAccess(userId)))
    .groupBy(lessons.id, lessons.title, lessons.orderIndex)
    .orderBy(lessons.orderIndex, lessons.id);

  let previousNonEmptyLessonPassed = true;

  return rows.map(row => {
    const totalWords = Number(row.totalWords);
    const learnedWords = Number(row.learnedWords);
    const masteredWords = Number(row.masteredWords);
    const requiredWords = Math.ceil(totalWords * LESSON_PROGRESSION_CONFIG.unlockRatio);
    const isUnlocked = totalWords === 0 || previousNonEmptyLessonPassed;

    if (totalWords > 0) {
      previousNonEmptyLessonPassed = isUnlocked && masteredWords >= requiredWords;
    }

    return {
      lessonId: row.lessonId,
      lessonTitle: row.lessonTitle,
      totalWords,
      learnedWords,
      masteredWords,
      requiredWords,
      isUnlocked,
    };
  });
}

export async function getNewVocabsForDeck(deckId: number, userId: string, limit = 5) {
  const nextLesson = await getNextUnlockedLessonWithNewVocab(deckId, userId);

  if (!nextLesson) {
    return [];
  }

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
        studyDeckAccess(userId),
        eq(lessons.id, nextLesson.lessonId),
        isNull(userVocabState.id),
      ),
    )
    .orderBy(lessons.orderIndex, vocabs.orderIndex, vocabs.id)
    .limit(limit);
}

export async function getNewVocabCountForDeck(deckId: number, userId: string): Promise<number> {
  const nextLesson = await getNextUnlockedLessonWithNewVocab(deckId, userId);
  if (!nextLesson) return 0;

  const [result] = await db
    .select({ count: count(vocabs.id) })
    .from(vocabs)
    .leftJoin(
      userVocabState,
      and(eq(userVocabState.vocabId, vocabs.id), eq(userVocabState.userId, userId)),
    )
    .where(and(eq(vocabs.lessonId, nextLesson.lessonId), isNull(userVocabState.id)));

  return Number(result?.count ?? 0);
}

async function getNextUnlockedLessonWithNewVocab(deckId: number, userId: string) {
  const lessonProgress = await getLessonProgressForDeck(deckId, userId);
  const unlockedLessonIds = lessonProgress
    .filter(lesson => lesson.isUnlocked && lesson.totalWords > 0)
    .map(lesson => lesson.lessonId);

  if (unlockedLessonIds.length === 0) return undefined;

  const [nextLesson] = await db
    .select({ lessonId: lessons.id })
    .from(lessons)
    .innerJoin(vocabs, eq(vocabs.lessonId, lessons.id))
    .leftJoin(
      userVocabState,
      and(eq(userVocabState.vocabId, vocabs.id), eq(userVocabState.userId, userId)),
    )
    .where(and(inArray(lessons.id, unlockedLessonIds), isNull(userVocabState.id)))
    .orderBy(lessons.orderIndex, lessons.id)
    .limit(1);

  return nextLesson;
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
        studyDeckAccess(userId),
        lte(userVocabState.dueAt, now),
      ),
    )
    .orderBy(userVocabState.dueAt);
}

export async function startVocab(vocabId: number, userId: string) {
  const now = new Date();
  const initialSrsState = getInitialSrsState(now);

  const [vocabAccess] = await db
    .select({ id: vocabs.id, deckId: decks.id, lessonId: lessons.id })
    .from(vocabs)
    .innerJoin(lessons, eq(vocabs.lessonId, lessons.id))
    .innerJoin(decks, eq(lessons.deckId, decks.id))
    .leftJoin(
      deckSubscriptions,
      and(eq(deckSubscriptions.deckId, decks.id), eq(deckSubscriptions.userId, userId)),
    )
    .where(and(eq(vocabs.id, vocabId), studyDeckAccess(userId)))
    .limit(1);

  if (!vocabAccess) {
    throw new Error('Vocab not found or access denied');
  }

  const lessonProgress = await getLessonProgressForDeck(vocabAccess.deckId, userId);
  const lessonIsUnlocked = lessonProgress.some(
    lesson => lesson.lessonId === vocabAccess.lessonId && lesson.isUnlocked,
  );

  if (!lessonIsUnlocked) {
    throw new Error('Complete more reviews in the previous lesson before starting this word');
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
        studyDeckAccess(userId),
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

function studyDeckAccess(userId: string) {
  return or(
    and(eq(decks.ownerId, userId), isNull(decks.deletedAt)),
    eq(deckSubscriptions.userId, userId),
  );
}

function viewDeckAccess(userId: string) {
  return or(
    and(isNull(decks.deletedAt), or(eq(decks.visibility, 'public'), eq(decks.ownerId, userId))),
    eq(deckSubscriptions.userId, userId),
  );
}
