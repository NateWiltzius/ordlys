'use server';

import { getDeckCardStudyCounts, getUserActiveDecks } from '@/db/queries/deck.queries';
import { getProgressAttemptStats } from '@/db/queries/review-attempt.queries';
import { getNewVocabCountsForDecks, getSrsCategoryCountsByDeck } from '@/db/queries/review.queries';
import { getCurrentUserId } from '@/lib/auth/get-current-user-id';
import {
  buildProgressActivitySeries,
  getProgressWindowStart,
  PROGRESS_ACTIVITY_WINDOW_DAYS,
} from '@/lib/progress-activity';
import { SRS_CATEGORIES, type SrsCategoryCounts } from '@/lib/srs/srs-config';
import type { ProgressPageData } from '@/types/progress.types';

export async function getProgressPageDataAction(): Promise<ProgressPageData> {
  const userId = await getCurrentUserId();
  const decks = await getUserActiveDecks(userId);
  const deckIds = decks.map(deck => deck.id);
  const now = new Date();

  const [studyCounts, newVocabCounts, srsCountsByDeck, attemptStats] = await Promise.all([
    getDeckCardStudyCounts(deckIds, userId),
    getNewVocabCountsForDecks(deckIds, userId),
    getSrsCategoryCountsByDeck(deckIds, userId),
    getProgressAttemptStats(
      userId,
      deckIds,
      getProgressWindowStart(PROGRESS_ACTIVITY_WINDOW_DAYS, now),
    ),
  ]);
  const srsCategoryCounts = Object.fromEntries(
    SRS_CATEGORIES.map(category => [
      category.key,
      deckIds.reduce((total, deckId) => total + (srsCountsByDeck[deckId]?.[category.key] ?? 0), 0),
    ]),
  ) as SrsCategoryCounts;

  const progressDecks = decks.map(deck => {
    const counts = studyCounts[deck.id];
    const recentAttempts = attemptStats.byDeck[deck.id];

    return {
      id: deck.id,
      title: deck.title,
      totalWords: counts?.totalWords ?? 0,
      startedWords: counts?.wordsInReview ?? 0,
      reviewsDue: counts?.reviewsDue ?? 0,
      newWordsAvailable: newVocabCounts[deck.id] ?? 0,
      srsCategoryCounts: srsCountsByDeck[deck.id],
      recentAttempts: recentAttempts?.attempts ?? 0,
      recentCorrectAttempts: recentAttempts?.correctAttempts ?? 0,
    };
  });

  return {
    activity: buildProgressActivitySeries(
      attemptStats.activity,
      PROGRESS_ACTIVITY_WINDOW_DAYS,
      now,
    ),
    decks: progressDecks,
    srsCategoryCounts,
    totalWords: progressDecks.reduce((total, deck) => total + deck.totalWords, 0),
    startedWords: progressDecks.reduce((total, deck) => total + deck.startedWords, 0),
  };
}
