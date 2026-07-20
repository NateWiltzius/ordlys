import { db } from '@/db';
import {
  deckFollows,
  decks,
  lessons,
  releaseVocabs,
  reviewAttempts,
  vocabRevisions,
  vocabs,
} from '@/db/schema';
import { activeReleaseIdExpression, studyDeckAccess } from '@/db/queries/deck-access';
import { vocabRevisionQuizSelection } from '@/db/queries/vocab-content';
import { and, count, countDistinct, desc, eq, gte, inArray, max, sql } from 'drizzle-orm';

const RECENT_MISTAKE_WINDOW_MS = 24 * 60 * 60 * 1000;

function recentMistakeCutoff() {
  return new Date(Date.now() - RECENT_MISTAKE_WINDOW_MS);
}

export async function getRecentMistakeVocabs(userId: string, limit = 25) {
  const cutoff = recentMistakeCutoff();
  const lastMissedAt = max(reviewAttempts.attemptedAt);
  const mistakes = await db
    .select({ vocabId: reviewAttempts.vocabId, lastMissedAt })
    .from(reviewAttempts)
    .where(
      and(
        eq(reviewAttempts.userId, userId),
        eq(reviewAttempts.isCorrect, false),
        eq(reviewAttempts.wasOverridden, false),
        gte(reviewAttempts.attemptedAt, cutoff),
      ),
    )
    .groupBy(reviewAttempts.vocabId)
    .orderBy(desc(lastMissedAt))
    .limit(limit);

  if (mistakes.length === 0) return [];

  const mistakeIds = mistakes.map(mistake => mistake.vocabId);
  const rows = await db
    .select({
      id: vocabs.id,
      ...vocabRevisionQuizSelection,
      lessonId: lessons.id,
      lessonTitle: lessons.title,
      deckTitle: decks.title,
      frontLanguage: decks.frontLanguage,
      backLanguage: decks.backLanguage,
    })
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
    .innerJoin(vocabRevisions, eq(vocabRevisions.id, releaseVocabs.revisionId))
    .leftJoin(deckFollows, and(eq(deckFollows.deckId, decks.id), eq(deckFollows.userId, userId)))
    .where(and(inArray(vocabs.id, mistakeIds), studyDeckAccess(userId)));

  const rowsById = new Map(rows.map(row => [row.id, row]));
  return mistakeIds.flatMap(id => {
    const row = rowsById.get(id);
    return row ? [row] : [];
  });
}

export async function getRecentMistakeCount(userId: string) {
  const [result] = await db
    .select({ value: countDistinct(reviewAttempts.vocabId) })
    .from(reviewAttempts)
    .innerJoin(vocabs, eq(vocabs.id, reviewAttempts.vocabId))
    .innerJoin(lessons, eq(lessons.id, vocabs.lessonId))
    .innerJoin(decks, eq(decks.id, lessons.deckId))
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
        eq(reviewAttempts.userId, userId),
        eq(reviewAttempts.isCorrect, false),
        eq(reviewAttempts.wasOverridden, false),
        gte(reviewAttempts.attemptedAt, recentMistakeCutoff()),
        studyDeckAccess(userId),
      ),
    );

  return Number(result?.value ?? 0);
}

export async function getProgressAttemptStats(userId: string, deckIds: number[], cutoff: Date) {
  if (deckIds.length === 0) return { activity: [], byDeck: {} };

  const day = sql<string>`to_char(${reviewAttempts.attemptedAt}, 'YYYY-MM-DD')`;
  const rows = await db
    .select({
      deckId: decks.id,
      day,
      attempts: count(reviewAttempts.id),
      correctAttempts: sql<number>`
        count(${reviewAttempts.id}) filter (where ${reviewAttempts.isCorrect})
      `,
    })
    .from(reviewAttempts)
    .innerJoin(vocabs, eq(vocabs.id, reviewAttempts.vocabId))
    .innerJoin(lessons, eq(lessons.id, vocabs.lessonId))
    .innerJoin(decks, eq(decks.id, lessons.deckId))
    .innerJoin(
      releaseVocabs,
      and(
        eq(releaseVocabs.vocabId, vocabs.id),
        eq(releaseVocabs.releaseId, activeReleaseIdExpression(userId, false)),
      ),
    )
    .where(
      and(
        eq(reviewAttempts.userId, userId),
        inArray(decks.id, deckIds),
        gte(reviewAttempts.attemptedAt, cutoff),
      ),
    )
    .groupBy(decks.id, day)
    .orderBy(day);

  const activityByDay = new Map<string, { attempts: number; correctAttempts: number }>();
  const byDeck: Record<number, { attempts: number; correctAttempts: number }> = {};

  for (const row of rows) {
    const attempts = Number(row.attempts);
    const correctAttempts = Number(row.correctAttempts);
    const dayTotals = activityByDay.get(row.day) ?? { attempts: 0, correctAttempts: 0 };
    dayTotals.attempts += attempts;
    dayTotals.correctAttempts += correctAttempts;
    activityByDay.set(row.day, dayTotals);

    const deckTotals = byDeck[row.deckId] ?? { attempts: 0, correctAttempts: 0 };
    deckTotals.attempts += attempts;
    deckTotals.correctAttempts += correctAttempts;
    byDeck[row.deckId] = deckTotals;
  }

  return {
    activity: Array.from(activityByDay, ([day, totals]) => ({
      day,
      attempts: totals.attempts,
      correctAttempts: totals.correctAttempts,
    })),
    byDeck,
  };
}
