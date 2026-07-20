import { and, count, desc, eq, gt, inArray, isNull, lte, or, sql } from 'drizzle-orm';
import { db } from '@/db';
import {
  deckFollows,
  decks,
  lessonRevisions,
  lessons,
  releaseLessons,
  releaseVocabs,
  reviewAttempts,
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
import type { SaveQuizAttemptInput } from '@/types/quiz.types';

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

export async function getSrsCategoryCountsByDeck(
  deckIds: number[],
  userId: string,
): Promise<Record<number, SrsCategoryCounts>> {
  const countsByDeck = Object.fromEntries(
    deckIds.map(deckId => [
      deckId,
      Object.fromEntries(SRS_CATEGORIES.map(category => [category.key, 0])) as SrsCategoryCounts,
    ]),
  );
  if (deckIds.length === 0) return countsByDeck;

  const rows = await db
    .select({
      deckId: decks.id,
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
    .groupBy(decks.id, userVocabState.srsLevel);

  for (const row of rows) {
    countsByDeck[row.deckId][getSrsCategoryKey(row.srsLevel)] += Number(row.count);
  }

  return countsByDeck;
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
      introducedWords: count(userVocabState.id),
      learnedWords: sql<number>`
        count(${userVocabState.id}) filter (
          where ${userVocabState.srsLevel} >= ${LESSON_PROGRESSION_CONFIG.learnedSrsLevel}
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
      introducedWords: count(userVocabState.id),
      learnedWords: sql<number>`
        count(${userVocabState.id}) filter (
          where ${userVocabState.srsLevel} >= ${LESSON_PROGRESSION_CONFIG.learnedSrsLevel}
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
      introducedWords: Number(row.introducedWords),
      learnedWords: Number(row.learnedWords),
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

export async function getDueReviews(userId: string, deckId?: number, limit: number | 'all' = 25) {
  const query = db
    .select({
      id: vocabs.id,
      ...vocabRevisionQuizSelection,
      lessonId: vocabs.lessonId,
      lessonTitle: lessons.title,
      deckTitle: sql<string>`
        case
          when ${decks.ownerId} = ${userId} then ${decks.title}
          else coalesce(
            (select title from deck_releases where id = ${activeReleaseIdExpression(userId, false)}),
            ${decks.title}
          )
        end
      `,
      stateId: userVocabState.id,
      srsLevel: userVocabState.srsLevel,
      frontLanguage: decks.frontLanguage,
      backLanguage: decks.backLanguage,
      availableCount: sql<number>`count(*) over()`,
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

  return limit === 'all' ? query : query.limit(Math.min(100, Math.max(1, Math.trunc(limit))));
}

export async function getDueReviewDeckBreakdown(userId: string) {
  const deckTitle = sql<string>`
    case
      when ${decks.ownerId} = ${userId} then ${decks.title}
      else coalesce(
        (select title from deck_releases where id = ${activeReleaseIdExpression(userId, false)}),
        ${decks.title}
      )
    end
  `;
  const dueCount = count(userVocabState.id);
  const rows = await db
    .select({
      deckId: decks.id,
      deckTitle,
      count: dueCount,
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
        studyDeckAccess(userId),
        lte(userVocabState.dueAt, sql`date_trunc('hour', now())`),
      ),
    )
    .groupBy(decks.id, decks.ownerId, decks.title)
    .orderBy(desc(dueCount), deckTitle);

  return rows.map(row => ({ ...row, count: Number(row.count) }));
}

export async function getDueReviewsForDeck(
  deckId: number,
  userId: string,
  limit: number | 'all' = 25,
) {
  return getDueReviews(userId, deckId, limit);
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

/**
 * Persists a directional answer and, when that answer completes the card,
 * applies the SRS transition in the same transaction. The client can safely
 * retry the same idempotency key after an interrupted request.
 */
export async function saveQuizAttempt(
  userId: string,
  input: SaveQuizAttemptInput,
): Promise<{ saved: boolean; transition: SrsTransition | null; deckId: number | null }> {
  const now = new Date();

  return db.transaction(async tx => {
    const [vocabAccess] = await tx
      .select({ id: vocabs.id, deckId: decks.id, lessonId: lessons.id })
      .from(vocabs)
      .innerJoin(lessons, eq(vocabs.lessonId, lessons.id))
      .innerJoin(decks, eq(lessons.deckId, decks.id))
      .leftJoin(deckFollows, and(eq(deckFollows.deckId, decks.id), eq(deckFollows.userId, userId)))
      .where(and(eq(vocabs.id, input.vocabId), studyDeckAccess(userId)))
      .limit(1);

    // A deck can be removed or unfollowed while a quiz is open. That makes the
    // queued attempt obsolete rather than retryable forever.
    if (!vocabAccess) return { saved: false, transition: null, deckId: null };

    const insertedAttempt = await tx
      .insert(reviewAttempts)
      .values({
        userId,
        vocabId: input.vocabId,
        mode: input.mode,
        direction: input.direction,
        isCorrect: input.isCorrect,
        wasOverridden: input.wasOverridden,
        idempotencyKey: input.idempotencyKey,
        attemptedAt: now,
      })
      .onConflictDoNothing()
      .returning({ id: reviewAttempts.id });

    if (insertedAttempt.length === 0) {
      return { saved: false, transition: null, deckId: vocabAccess.deckId };
    }
    if (!input.completesCard) {
      return { saved: true, transition: null, deckId: vocabAccess.deckId };
    }

    if (input.mode === 'learn') {
      const lessonProgress = await getLessonProgressForDeck(vocabAccess.deckId, userId);
      const lessonIsUnlocked = lessonProgress.some(
        lesson => lesson.lessonId === vocabAccess.lessonId && lesson.isUnlocked,
      );
      if (!lessonIsUnlocked) {
        return { saved: true, transition: null, deckId: vocabAccess.deckId };
      }

      const initialState = getInitialSrsState(now);
      const insertedState = await tx
        .insert(userVocabState)
        .values({
          userId,
          vocabId: input.vocabId,
          dueAt: initialState.dueAt,
          srsLevel: initialState.srsLevel,
        })
        .onConflictDoNothing({ target: [userVocabState.userId, userVocabState.vocabId] })
        .returning({ id: userVocabState.id });

      return {
        saved: true,
        transition: insertedState.length
          ? { previousLevel: null, nextLevel: initialState.srsLevel }
          : null,
        deckId: vocabAccess.deckId,
      };
    }

    if (input.mode === 'review') {
      const [state] = await tx
        .select({ srsLevel: userVocabState.srsLevel })
        .from(userVocabState)
        .where(
          and(
            eq(userVocabState.vocabId, input.vocabId),
            eq(userVocabState.userId, userId),
            lte(userVocabState.dueAt, sql`date_trunc('hour', now())`),
          ),
        )
        .for('update')
        .limit(1);
      // Another tab or an earlier retry may already have advanced this card.
      // The directional attempt is still valid history, but the SRS transition
      // must not be applied twice.
      if (!state) {
        return { saved: true, transition: null, deckId: vocabAccess.deckId };
      }

      const nextState = getNextSrsState({
        currentSrsLevel: state.srsLevel,
        wasCorrect: input.cardWasCorrect,
        now,
      });
      await tx
        .update(userVocabState)
        .set({ srsLevel: nextState.srsLevel, dueAt: nextState.dueAt, updatedAt: now })
        .where(and(eq(userVocabState.vocabId, input.vocabId), eq(userVocabState.userId, userId)));

      return {
        saved: true,
        transition: { previousLevel: state.srsLevel, nextLevel: nextState.srsLevel },
        deckId: vocabAccess.deckId,
      };
    }

    const lessonProgress = await getLessonProgressForDeck(vocabAccess.deckId, userId);
    const placementLesson = lessonProgress.find(lesson => lesson.lessonId === vocabAccess.lessonId);
    if (!placementLesson?.canTakePlacementTest) {
      return { saved: true, transition: null, deckId: vocabAccess.deckId };
    }

    const [existingState] = await tx
      .select({ srsLevel: userVocabState.srsLevel })
      .from(userVocabState)
      .where(and(eq(userVocabState.vocabId, input.vocabId), eq(userVocabState.userId, userId)))
      .for('update')
      .limit(1);

    if (!input.cardWasCorrect) {
      return {
        saved: true,
        transition: existingState
          ? { previousLevel: existingState.srsLevel, nextLevel: existingState.srsLevel }
          : { previousLevel: null, nextLevel: null },
        deckId: vocabAccess.deckId,
      };
    }

    const targetState = getSrsStateForLevel(PLACEMENT_TEST_CONFIG.passedSrsLevel, now);
    if (!existingState || existingState.srsLevel < targetState.srsLevel) {
      await tx
        .insert(userVocabState)
        .values({
          userId,
          vocabId: input.vocabId,
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
    }

    return {
      saved: true,
      transition: {
        previousLevel: existingState?.srsLevel ?? null,
        nextLevel: Math.max(existingState?.srsLevel ?? 0, targetState.srsLevel),
      },
      deckId: vocabAccess.deckId,
    };
  });
}
