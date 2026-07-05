import { and, count, eq, inArray, isNull, lte, sql } from 'drizzle-orm';
import { db } from '@/db';
import { deckSubscriptions, decks, lessons, vocabs, userVocabState } from '@/db/schema';
import { getInitialSrsState, getNextSrsState, getSrsStateForLevel } from '@/lib/srs/srs-scheduler';
import { LESSON_PROGRESSION_CONFIG, PLACEMENT_TEST_CONFIG } from '@/lib/srs/srs-config';
import type { LessonProgress, SrsTransition } from '@/types/review.types';
import { studyDeckAccess, viewDeckAccess } from '@/db/queries/deck-access';

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

export async function getPlacementTestVocabs(deckId: number, lessonId: number, userId: string) {
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
    .where(and(eq(decks.id, deckId), eq(lessons.id, lessonId), studyDeckAccess(userId)))
    .orderBy(vocabs.orderIndex, vocabs.id);
}

export async function startVocab(vocabId: number, userId: string): Promise<SrsTransition> {
  const now = new Date();
  const initialSrsState = getInitialSrsState(now);

  return db.transaction(async tx => {
    const [vocabAccess] = await tx
      .select({ id: vocabs.id, deckId: decks.id, lessonId: lessons.id })
      .from(vocabs)
      .innerJoin(lessons, eq(vocabs.lessonId, lessons.id))
      .innerJoin(decks, eq(lessons.deckId, decks.id))
      .innerJoin(
        deckSubscriptions,
        and(eq(deckSubscriptions.deckId, decks.id), eq(deckSubscriptions.userId, userId)),
      )
      .where(and(eq(vocabs.id, vocabId), studyDeckAccess(userId)))
      .for('update')
      .limit(1);

    if (!vocabAccess) throw new Error('Vocab not found or access denied');

    const lessonProgress = await getLessonProgressForDeck(vocabAccess.deckId, userId);
    const lessonIsUnlocked = lessonProgress.some(
      lesson => lesson.lessonId === vocabAccess.lessonId && lesson.isUnlocked,
    );
    if (!lessonIsUnlocked) {
      throw new Error('Complete more reviews in the previous lesson before starting this word');
    }

    await tx
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

    return { previousLevel: null, nextLevel: initialSrsState.srsLevel };
  });
}

export async function reviewVocab(
  vocabId: number,
  userId: string,
  wasCorrect: boolean,
): Promise<SrsTransition> {
  const now = new Date();

  return db.transaction(async tx => {
    const [state] = await tx
      .select({ srsLevel: userVocabState.srsLevel })
      .from(userVocabState)
      .innerJoin(vocabs, eq(userVocabState.vocabId, vocabs.id))
      .innerJoin(lessons, eq(vocabs.lessonId, lessons.id))
      .innerJoin(decks, eq(lessons.deckId, decks.id))
      .innerJoin(
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
      .for('update')
      .limit(1);
    if (!state) throw new Error('User vocab state not found or access denied');

    const nextSrsState = getNextSrsState({
      currentSrsLevel: state.srsLevel,
      wasCorrect,
      now,
    });
    await tx
      .update(userVocabState)
      .set({ srsLevel: nextSrsState.srsLevel, dueAt: nextSrsState.dueAt, updatedAt: now })
      .where(and(eq(userVocabState.vocabId, vocabId), eq(userVocabState.userId, userId)));

    return { previousLevel: state.srsLevel, nextLevel: nextSrsState.srsLevel };
  });
}

export async function placeVocab(
  vocabId: number,
  userId: string,
  wasCorrect: boolean,
): Promise<SrsTransition> {
  const now = new Date();
  const targetState = getSrsStateForLevel(
    wasCorrect ? PLACEMENT_TEST_CONFIG.passedSrsLevel : 0,
    now,
  );

  return db.transaction(async tx => {
    const [vocabAccess] = await tx
      .select({ id: vocabs.id })
      .from(vocabs)
      .innerJoin(lessons, eq(vocabs.lessonId, lessons.id))
      .innerJoin(decks, eq(lessons.deckId, decks.id))
      .innerJoin(
        deckSubscriptions,
        and(eq(deckSubscriptions.deckId, decks.id), eq(deckSubscriptions.userId, userId)),
      )
      .where(and(eq(vocabs.id, vocabId), studyDeckAccess(userId)))
      .for('update')
      .limit(1);
    if (!vocabAccess) throw new Error('Vocab not found or access denied');

    const [existingState] = await tx
      .select({ srsLevel: userVocabState.srsLevel })
      .from(userVocabState)
      .where(and(eq(userVocabState.vocabId, vocabId), eq(userVocabState.userId, userId)))
      .for('update')
      .limit(1);
    if (existingState && existingState.srsLevel >= targetState.srsLevel) {
      return { previousLevel: existingState.srsLevel, nextLevel: existingState.srsLevel };
    }

    await tx
      .insert(userVocabState)
      .values({
        userId,
        vocabId,
        srsLevel: targetState.srsLevel,
        dueAt: targetState.dueAt,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [userVocabState.userId, userVocabState.vocabId],
        set: {
          srsLevel: targetState.srsLevel,
          dueAt: targetState.dueAt,
          updatedAt: now,
        },
      });

    return { previousLevel: existingState?.srsLevel ?? null, nextLevel: targetState.srsLevel };
  });
}
