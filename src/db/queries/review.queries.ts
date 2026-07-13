import { and, count, eq, gt, inArray, isNull, lte, or, sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  deckFollows,
  decks,
  lessonRevisions,
  lessons,
  releaseLessons,
  releaseVocabs,
  vocabs,
  userVocabState,
  vocabRevisions,
} from '@/db/schema';
import { getInitialSrsState, getNextSrsState, getSrsStateForLevel } from '@/lib/srs/srs-scheduler';
import { LESSON_PROGRESSION_CONFIG, PLACEMENT_TEST_CONFIG } from '@/lib/srs/srs-config';
import type { LessonProgress, SrsTransition } from '@/types/review.types';
import {
  activeReleaseIdExpression,
  studyDeckAccess,
  viewDeckAccess,
} from '@/db/queries/deck-access';
import { getReviewForecastEnd } from '@/lib/review-forecast';
import { buildLessonProgress } from '@/lib/srs/lesson-progress';
import {
  vocabRevisionExtendedSelection,
  vocabRevisionQuizSelection,
} from '@/db/queries/vocab-content';

export async function getLessonProgressForDeck(
  deckId: number,
  userId: string,
): Promise<LessonProgress[]> {
  const rows = await db
    .select({
      lessonId: lessons.id,
      lessonTitle: lessonRevisions.title,
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
    .innerJoin(
      releaseLessons,
      and(
        eq(releaseLessons.lessonId, lessons.id),
        eq(releaseLessons.releaseId, activeReleaseIdExpression(userId, true)),
      ),
    )
    .innerJoin(lessonRevisions, eq(lessonRevisions.id, releaseLessons.revisionId))
    .leftJoin(deckFollows, and(eq(deckFollows.deckId, decks.id), eq(deckFollows.userId, userId)))
    .leftJoin(
      releaseVocabs,
      and(
        eq(releaseVocabs.releaseId, releaseLessons.releaseId),
        eq(releaseVocabs.lessonId, lessons.id),
      ),
    )
    .leftJoin(vocabs, eq(vocabs.id, releaseVocabs.vocabId))
    .leftJoin(
      userVocabState,
      and(eq(userVocabState.vocabId, vocabs.id), eq(userVocabState.userId, userId)),
    )
    .where(and(eq(decks.id, deckId), viewDeckAccess(userId)))
    .groupBy(lessons.id, lessonRevisions.title, releaseLessons.orderIndex)
    .orderBy(releaseLessons.orderIndex, lessons.id);

  return buildLessonProgress(rows);
}

export async function getNewVocabsForDeck(deckId: number, userId: string, limit = 5) {
  const nextLesson = await getNextUnlockedLessonWithNewVocab(deckId, userId);

  if (!nextLesson) {
    return [];
  }

  return db
    .select({
      id: vocabs.id,
      ...vocabRevisionQuizSelection,
      tags: vocabRevisionExtendedSelection.tags,
      notes: vocabRevisionExtendedSelection.notes,
      lessonId: vocabs.lessonId,
      lessonTitle: lessons.title,
      frontLanguage: decks.frontLanguage,
      backLanguage: decks.backLanguage,
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
    .innerJoin(vocabRevisions, eq(vocabRevisions.id, releaseVocabs.revisionId))
    .leftJoin(deckFollows, and(eq(deckFollows.deckId, decks.id), eq(deckFollows.userId, userId)))
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
    .innerJoin(lessons, eq(lessons.id, vocabs.lessonId))
    .innerJoin(decks, eq(decks.id, lessons.deckId))
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
    .where(and(eq(vocabs.lessonId, nextLesson.lessonId), isNull(userVocabState.id)));

  return Number(result?.count ?? 0);
}

export async function getNewVocabCountsForDecks(
  deckIds: number[],
  userId: string,
): Promise<Record<number, number>> {
  if (deckIds.length === 0) return {};

  const rows = await db
    .select({
      deckId: lessons.deckId,
      lessonId: lessons.id,
      totalWords: count(vocabs.id),
      learnedWords: count(userVocabState.id),
      masteredWords: sql<number>`
        count(${userVocabState.id}) filter (
          where ${userVocabState.srsLevel} >= ${LESSON_PROGRESSION_CONFIG.unlockSrsLevel}
        )
      `,
    })
    .from(lessons)
    .innerJoin(decks, eq(decks.id, lessons.deckId))
    .innerJoin(
      releaseLessons,
      and(
        eq(releaseLessons.lessonId, lessons.id),
        eq(releaseLessons.releaseId, activeReleaseIdExpression(userId, false)),
      ),
    )
    .leftJoin(
      releaseVocabs,
      and(
        eq(releaseVocabs.releaseId, releaseLessons.releaseId),
        eq(releaseVocabs.lessonId, lessons.id),
      ),
    )
    .leftJoin(vocabs, eq(vocabs.id, releaseVocabs.vocabId))
    .leftJoin(
      userVocabState,
      and(eq(userVocabState.vocabId, vocabs.id), eq(userVocabState.userId, userId)),
    )
    .where(inArray(lessons.deckId, deckIds))
    .groupBy(lessons.deckId, lessons.id, lessons.orderIndex)
    .orderBy(lessons.deckId, lessons.orderIndex, lessons.id);

  const counts: Record<number, number> = Object.fromEntries(deckIds.map(deckId => [deckId, 0]));
  const previousLessonPassed: Record<number, boolean> = {};

  for (const row of rows) {
    const totalWords = Number(row.totalWords);
    const learnedWords = Number(row.learnedWords);
    const masteredWords = Number(row.masteredWords);
    const previousPassed = previousLessonPassed[row.deckId] ?? true;
    const isUnlocked = totalWords === 0 || previousPassed;

    if (isUnlocked && totalWords > learnedWords && counts[row.deckId] === 0) {
      counts[row.deckId] = totalWords - learnedWords;
    }

    if (totalWords > 0) {
      const requiredWords = Math.ceil(totalWords * LESSON_PROGRESSION_CONFIG.unlockRatio);
      previousLessonPassed[row.deckId] = isUnlocked && masteredWords >= requiredWords;
    }
  }

  return counts;
}

export async function getReviewForecastCounts(
  userId: string,
  deckIds?: number[],
): Promise<Record<string, number>> {
  if (deckIds?.length === 0) return {};

  const roundedDueAt = sql<Date>`
    case
      when ${userVocabState.dueAt} = date_trunc('hour', ${userVocabState.dueAt})
        then ${userVocabState.dueAt}
      else date_trunc('hour', ${userVocabState.dueAt}) + interval '1 hour'
    end
  `;
  const bucketExpression = sql<string>`
    case
      when ${roundedDueAt} <= date_trunc('hour', now()) then 'due'
      else to_char(${roundedDueAt}, 'YYYY-MM-DD"T"HH24:00:00"Z"')
    end
  `;
  const deckScope = deckIds
    ? inArray(decks.id, deckIds)
    : or(
        and(eq(decks.ownerId, userId), eq(decks.status, 'active')),
        and(
          eq(deckFollows.userId, userId),
          or(eq(deckFollows.status, 'active'), eq(deckFollows.status, 'frozen')),
        ),
      );

  const rows = await db
    .select({
      bucket: bucketExpression,
      count: count(userVocabState.id),
    })
    .from(userVocabState)
    .innerJoin(vocabs, eq(userVocabState.vocabId, vocabs.id))
    .innerJoin(lessons, eq(vocabs.lessonId, lessons.id))
    .innerJoin(decks, eq(lessons.deckId, decks.id))
    .innerJoin(
      releaseVocabs,
      and(
        eq(releaseVocabs.vocabId, vocabs.id),
        eq(releaseVocabs.releaseId, activeReleaseIdExpression(userId, false)),
      ),
    )
    .leftJoin(deckFollows, and(eq(deckFollows.deckId, decks.id), eq(deckFollows.userId, userId)))
    .where(
      and(
        eq(userVocabState.userId, userId),
        sql`${roundedDueAt} < ${getReviewForecastEnd().toISOString()}::timestamp`,
        deckScope,
      ),
    )
    .groupBy(bucketExpression);

  return Object.fromEntries(rows.map(row => [row.bucket, Number(row.count)]));
}

export async function getNextReviewBatch(
  userId: string,
  deckIds?: number[],
): Promise<{ hour: string; count: number } | null> {
  if (deckIds?.length === 0) return null;

  const roundedDueAt = sql<Date>`
    case
      when ${userVocabState.dueAt} = date_trunc('hour', ${userVocabState.dueAt})
        then ${userVocabState.dueAt}
      else date_trunc('hour', ${userVocabState.dueAt}) + interval '1 hour'
    end
  `;
  const deckScope = deckIds
    ? inArray(decks.id, deckIds)
    : or(
        and(eq(decks.ownerId, userId), eq(decks.status, 'active')),
        and(
          eq(deckFollows.userId, userId),
          or(eq(deckFollows.status, 'active'), eq(deckFollows.status, 'frozen')),
        ),
      );

  const [nextBatch] = await db
    .select({
      hour: sql<string>`to_char(${roundedDueAt}, 'YYYY-MM-DD"T"HH24:00:00"Z"')`,
      count: count(userVocabState.id),
    })
    .from(userVocabState)
    .innerJoin(vocabs, eq(userVocabState.vocabId, vocabs.id))
    .innerJoin(lessons, eq(vocabs.lessonId, lessons.id))
    .innerJoin(decks, eq(lessons.deckId, decks.id))
    .innerJoin(
      releaseVocabs,
      and(
        eq(releaseVocabs.vocabId, vocabs.id),
        eq(releaseVocabs.releaseId, activeReleaseIdExpression(userId, false)),
      ),
    )
    .leftJoin(deckFollows, and(eq(deckFollows.deckId, decks.id), eq(deckFollows.userId, userId)))
    .where(
      and(
        eq(userVocabState.userId, userId),
        gt(roundedDueAt, sql`date_trunc('hour', now())`),
        deckScope,
      ),
    )
    .groupBy(roundedDueAt)
    .orderBy(roundedDueAt)
    .limit(1);

  return nextBatch ? { hour: nextBatch.hour, count: Number(nextBatch.count) } : null;
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
    .innerJoin(decks, eq(decks.id, lessons.deckId))
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
    .where(and(inArray(lessons.id, unlockedLessonIds), isNull(userVocabState.id)))
    .orderBy(lessons.orderIndex, lessons.id)
    .limit(1);

  return nextLesson;
}

export async function getDueReviewsForDeck(deckId: number, userId: string) {
  return db
    .select({
      id: vocabs.id,
      ...vocabRevisionQuizSelection,
      lessonId: vocabs.lessonId,
      lessonTitle: lessons.title,
      stateId: userVocabState.id,
      srsLevel: userVocabState.srsLevel,
      frontLanguage: decks.frontLanguage,
      backLanguage: decks.backLanguage,
    })
    .from(userVocabState)
    .innerJoin(vocabs, eq(userVocabState.vocabId, vocabs.id))
    .innerJoin(lessons, eq(vocabs.lessonId, lessons.id))
    .innerJoin(decks, eq(lessons.deckId, decks.id))
    .innerJoin(
      releaseVocabs,
      and(
        eq(releaseVocabs.vocabId, vocabs.id),
        eq(releaseVocabs.releaseId, activeReleaseIdExpression(userId, false)),
      ),
    )
    .innerJoin(vocabRevisions, eq(vocabRevisions.id, releaseVocabs.revisionId))
    .leftJoin(deckFollows, and(eq(deckFollows.deckId, decks.id), eq(deckFollows.userId, userId)))
    .where(
      and(
        eq(userVocabState.userId, userId),
        eq(decks.id, deckId),
        studyDeckAccess(userId),
        lte(userVocabState.dueAt, sql`date_trunc('hour', now())`),
      ),
    )
    .orderBy(userVocabState.dueAt);
}

export async function getPlacementTestVocabs(deckId: number, lessonId: number, userId: string) {
  const lessonProgress = await getLessonProgressForDeck(deckId, userId);
  const requestedLesson = lessonProgress.find(lesson => lesson.lessonId === lessonId);
  if (!requestedLesson?.canTakePlacementTest) return [];

  return db
    .select({
      id: vocabs.id,
      ...vocabRevisionQuizSelection,
      lessonId: vocabs.lessonId,
      lessonTitle: lessons.title,
      frontLanguage: decks.frontLanguage,
      backLanguage: decks.backLanguage,
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
    .innerJoin(vocabRevisions, eq(vocabRevisions.id, releaseVocabs.revisionId))
    .leftJoin(deckFollows, and(eq(deckFollows.deckId, decks.id), eq(deckFollows.userId, userId)))
    .leftJoin(
      userVocabState,
      and(eq(userVocabState.vocabId, vocabs.id), eq(userVocabState.userId, userId)),
    )
    .where(
      and(
        eq(decks.id, deckId),
        eq(lessons.id, lessonId),
        studyDeckAccess(userId),
        isNull(userVocabState.id),
      ),
    )
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
      .leftJoin(deckFollows, and(eq(deckFollows.deckId, decks.id), eq(deckFollows.userId, userId)))
      .where(and(eq(vocabs.id, vocabId), studyDeckAccess(userId)))
      .for('update', { of: vocabs })
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
      .leftJoin(deckFollows, and(eq(deckFollows.deckId, decks.id), eq(deckFollows.userId, userId)))
      .where(
        and(
          eq(userVocabState.vocabId, vocabId),
          eq(userVocabState.userId, userId),
          studyDeckAccess(userId),
          lte(userVocabState.dueAt, sql`date_trunc('hour', now())`),
        ),
      )
      .for('update', { of: userVocabState })
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
  const targetState = getSrsStateForLevel(PLACEMENT_TEST_CONFIG.passedSrsLevel, now);

  return db.transaction(async tx => {
    const [vocabAccess] = await tx
      .select({ id: vocabs.id, deckId: decks.id, lessonId: lessons.id })
      .from(vocabs)
      .innerJoin(lessons, eq(vocabs.lessonId, lessons.id))
      .innerJoin(decks, eq(lessons.deckId, decks.id))
      .leftJoin(deckFollows, and(eq(deckFollows.deckId, decks.id), eq(deckFollows.userId, userId)))
      .where(and(eq(vocabs.id, vocabId), studyDeckAccess(userId)))
      .for('update', { of: vocabs })
      .limit(1);
    if (!vocabAccess) throw new Error('Vocab not found or access denied');

    const lessonProgress = await getLessonProgressForDeck(vocabAccess.deckId, userId);
    const placementLesson = lessonProgress.find(lesson => lesson.lessonId === vocabAccess.lessonId);
    if (!placementLesson?.canTakePlacementTest) {
      throw new Error(
        'Reach the required SRS level in the previous lesson before taking this test',
      );
    }

    const [existingState] = await tx
      .select({ srsLevel: userVocabState.srsLevel })
      .from(userVocabState)
      .where(and(eq(userVocabState.vocabId, vocabId), eq(userVocabState.userId, userId)))
      .for('update')
      .limit(1);

    if (!wasCorrect) {
      return existingState
        ? { previousLevel: existingState.srsLevel, nextLevel: existingState.srsLevel }
        : { previousLevel: null, nextLevel: null };
    }

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
