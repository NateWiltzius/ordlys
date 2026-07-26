import 'server-only';

import { getActiveReleaseId } from '@/db/queries/deck-access';
import { getDeckStudyCounts } from '@/db/queries/deck.queries';
import { getNextReviewBatch, getReviewForecastCounts } from '@/db/queries/review.queries';
import { getCurrentUserId } from '@/lib/auth/get-current-user-id';
import { buildReviewForecast } from '@/lib/review-forecast';
import { cache } from 'react';

export const getCachedDeckStudyData = cache(async (deckId: number) => {
  const userId = await getCurrentUserId();
  const [counts, forecastCounts, nextReview, activeReleaseId] = await Promise.all([
    getDeckStudyCounts(deckId, userId),
    getReviewForecastCounts(userId, [deckId]),
    getNextReviewBatch(userId, [deckId]),
    getActiveReleaseId(deckId, userId),
  ]);

  return {
    counts,
    canStudy: activeReleaseId !== null,
    reviewForecast: buildReviewForecast(forecastCounts),
    nextReview,
  };
});
