import 'server-only';

import {
  getDeckCardStudyCounts,
  getDecksByOwnerId,
  getOwnedDeckById,
  getPublicDecks,
  getRestorableDecksByOwnerId,
  getUserActiveDecks,
  getUserFollowedDecks,
} from '@/db/queries/deck.queries';
import {
  getDeckProvenance,
  getRemovedDraftItems,
  hasUnpublishedDraftChanges,
  listReleaseHistory,
} from '@/db/queries/deck-release.queries';
import { getEditLessonSummaries } from '@/db/queries/lesson.queries';
import {
  getNewVocabCountsForDecks,
  getNextReviewBatch,
  getReviewForecastCounts,
} from '@/db/queries/review.queries';
import { getCurrentUserId } from '@/lib/auth/get-current-user-id';
import { buildReviewForecast } from '@/lib/review-forecast';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import type { ReviewCounts } from '@/types/review.types';

export async function getDashboardData() {
  const userId = await getCurrentUserId();
  const activeDecks = await getUserActiveDecks(userId);
  const activeDeckIds = activeDecks.map(deck => deck.id);
  const [deckStudyCounts, newVocabCounts, forecastCounts, nextReview] = await Promise.all([
    getDeckCardStudyCounts(activeDeckIds, userId),
    getNewVocabCountsForDecks(activeDeckIds, userId),
    getReviewForecastCounts(userId, activeDeckIds),
    getNextReviewBatch(userId, activeDeckIds),
  ]);

  const deckStats: Record<number, ReviewCounts> = Object.fromEntries(
    activeDeckIds.map(deckId => [
      deckId,
      {
        totalWords: deckStudyCounts[deckId]?.totalWords ?? 0,
        newWordsAvailable: newVocabCounts[deckId] ?? 0,
        reviewsDue: deckStudyCounts[deckId]?.reviewsDue ?? 0,
        wordsInReview: deckStudyCounts[deckId]?.wordsInReview ?? 0,
      },
    ]),
  );
  const allDeckStats = Object.values(deckStats).reduce(
    (totals, stats) => ({
      totalWords: totals.totalWords + stats.totalWords,
      newWordsAvailable: totals.newWordsAvailable + stats.newWordsAvailable,
      reviewsDue: totals.reviewsDue + stats.reviewsDue,
      wordsInReview: totals.wordsInReview + stats.wordsInReview,
    }),
    { totalWords: 0, newWordsAvailable: 0, reviewsDue: 0, wordsInReview: 0 },
  );

  return {
    activeDecks,
    allDeckStats,
    deckStats,
    reviewForecast: buildReviewForecast(forecastCounts),
    nextReview,
  };
}

export async function getLibraryPageData() {
  const userId = await getCurrentUserId();
  const [ownedDecks, learningDecks, restorableDecks] = await Promise.all([
    getDecksByOwnerId(userId),
    getUserFollowedDecks(userId),
    getRestorableDecksByOwnerId(userId),
  ]);
  const activeDeckIds = [...new Set([...ownedDecks, ...learningDecks].map(deck => deck.id))];
  const [deckStudyCounts, newVocabCounts] = await Promise.all([
    getDeckCardStudyCounts(activeDeckIds, userId),
    getNewVocabCountsForDecks(activeDeckIds, userId),
  ]);
  const deckStats = Object.fromEntries(
    activeDeckIds.map(deckId => [
      deckId,
      {
        totalWords: deckStudyCounts[deckId]?.totalWords ?? 0,
        reviewsDue: deckStudyCounts[deckId]?.reviewsDue ?? 0,
        wordsInReview: deckStudyCounts[deckId]?.wordsInReview ?? 0,
        newWordsAvailable: newVocabCounts[deckId] ?? 0,
      },
    ]),
  );

  return { ownedDecks, learningDecks, restorableDecks, deckStats };
}

export async function getDiscoverPageData() {
  const userId = await getCurrentUserId();
  const [ownedDecks, publicDecks, learningDecks] = await Promise.all([
    getDecksByOwnerId(userId),
    getPublicDecks(),
    getUserFollowedDecks(userId),
  ]);
  return {
    publicDecks,
    ownedDeckIds: ownedDecks.map(deck => deck.id),
    followingDeckIds: learningDecks.map(deck => deck.id),
  };
}

export async function getEditDeckPageData(id: number) {
  const deckId = parsePositiveInteger(id);
  if (!deckId) throw new Error('Invalid deck ID.');
  const userId = await getCurrentUserId();
  const deck = await getOwnedDeckById(deckId, userId);
  if (!deck) return null;
  const [lessons, releases, hasUnpublishedChanges, provenance, removedDraftItems] =
    await Promise.all([
      getEditLessonSummaries(deckId),
      listReleaseHistory(deckId, userId),
      hasUnpublishedDraftChanges(deckId),
      getDeckProvenance(deckId),
      getRemovedDraftItems(deckId),
    ]);
  return {
    deck,
    lessons,
    releases,
    hasUnpublishedChanges,
    provenance,
    removedDraftItems,
  };
}
