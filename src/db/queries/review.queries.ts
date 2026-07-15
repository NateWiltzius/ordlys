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
import {
  getSrsCategoryKey,
  LESSON_PROGRESSION_CONFIG,
  PLACEMENT_TEST_CONFIG,
  SRS_CATEGORIES,
  type SrsCategoryCounts,
} from '@/lib/srs/srs-config';
import type { LessonProgress, SrsTransition } from '@/types/review.types';
import {
  activeReleaseIdExpression,
  studyDeckAccess,
  viewDeckAccess,
} from '@/db/queries/deck-access';
import { getReviewForecastEnd } from '@/lib/review-forecast';
import {
  buildLessonProgress,
  getUnlockedLessonIdsWithNewVocab,
  getUnlockedNewVocabCount,
} from '@/lib/srs/lesson-progress';
import {
  vocabRevisionExtendedSelection,
  vocabRevisionQuizSelection,
} from '@/db/queries/vocab-content';

export async function getSrsCategoryCountsForDecks(
  deckIds: number[],
  userId: string,
): Promise<SrsCategoryCounts> {
  const counts = Object.fromEntries(
    SRS_CATEGORIES.map(category => [category.key, 0]),
  ) as SrsCategoryCounts;
  if (deckIds.length === 0) return counts;

  const rows = await db
    .select({
      srsLevel: userVocabState.srsLevel,
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
    .where(and(eq(userVocabState.userId, userId), inArray(decks.id, deckIds)))
    .groupBy(userVocabState.srsLevel);

  for (const row of rows) {
    counts[getSrsCategoryKey(row.srsLevel)] += Number(row.count);
  }

  return counts;
}

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
  const lessonProgress = await getLessonProgressForDeck(deckId, userId);
  const unlockedLessonIds = getUnlockedLessonIdsWithNewVocab(lessonProgress);

  if (unlockedLessonIds.length === 0) {
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
        inArray(lessons.id, unlockedLessonIds),
        isNull(userVocabState.id),
      ),
    )
    .orderBy(lessons.orderIndex, vocabs.orderIndex, vocabs.id)
    .limit(limit);
}

export async function getNewVocabCountForDeck(deckId: number, userId: string): Promise<number> {
  const lessonProgress = await getLessonProgressForDeck(deckId, userId);
  const unlockedLessonIds = getUnlockedLessonIdsWithNewVocab(lessonProgress);
  if (unlockedLessonIds.length === 0) return 0;

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
    .where(and(inArray(vocabs.lessonId, unlockedLessonIds), isNull(userVocabState.id)));

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
  const progressRowsByDeck = new Map<number, Parameters<typeof buildLessonProgress>[0]>();

  for (const row of rows) {
    const progressRows = progressRowsByDeck.get(row.deckId) ?? [];
    progressRows.push({
      lessonId: row.lessonId,
      lessonTitle: '',
      totalWords: Number(row.totalWords),
      learnedWords: Number(row.learnedWords),
      masteredWords: Number(row.masteredWords),
    });
    progressRowsByDeck.set(row.deckId, progressRows);
  }

  for (const [deckId, progressRows] of progressRowsByDeck) {
    counts[deckId] = getUnlockedNewVocabCount(buildLessonProgress(progressRows));
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

export async function getDueReviews(userId: string, deckId?: number) {
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
        deckId === undefined ? undefined : eq(decks.id, deckId),
        studyDeckAccess(userId),
        lte(userVocabState.dueAt, sql`date_trunc('hour', now())`),
      ),
    )
    .orderBy(userVocabState.dueAt);
}

export async function getDueReviewsForDeck(deckId: number, userId: string) {
  return getDueReviews(userId, deckId);
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
