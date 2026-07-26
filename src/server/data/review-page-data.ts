import 'server-only';

import { getActiveReleaseId } from '@/db/queries/deck-access';
import { getAccessibleDeckById } from '@/db/queries/deck.queries';
import { getRecentMistakeCount, getRecentMistakeVocabs } from '@/db/queries/review-attempt.queries';
import {
  getDueReviewDeckBreakdown,
  getDueReviews,
  getDueReviewsForDeck,
  getLessonProgressForDeck,
  getNewVocabCountForDeck,
  getNewVocabsForDeck,
  getNextReviewBatch,
  getPlacementTestVocabs,
} from '@/db/queries/review.queries';
import { getCurrentUserId } from '@/lib/auth/get-current-user-id';
import {
  DEFAULT_LEARN_SESSION_SIZE,
  DEFAULT_REVIEW_SESSION_SIZE,
  LEARN_SESSION_SIZES,
  REVIEW_SESSION_SIZES,
} from '@/lib/study-session-size';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';

export async function getLessonProgressData(id: number) {
  const deckId = parsePositiveInteger(id);
  if (!deckId) throw new Error('Invalid deck ID.');
  return getLessonProgressForDeck(deckId, await getCurrentUserId());
}

export async function getLearnPageData(
  id: number,
  requestedLimit: number | 'all' = DEFAULT_LEARN_SESSION_SIZE,
) {
  const deckId = parsePositiveInteger(id);
  if (!deckId) throw new Error('Invalid deck ID.');
  const requestedSize =
    requestedLimit === 'all'
      ? 'all'
      : LEARN_SESSION_SIZES.includes(requestedLimit as (typeof LEARN_SESSION_SIZES)[number])
        ? requestedLimit
        : DEFAULT_LEARN_SESSION_SIZE;
  const userId = await getCurrentUserId();
  if (!(await getActiveReleaseId(deckId, userId))) return null;
  const [deck, lessonProgress, availableCount] = await Promise.all([
    getAccessibleDeckById(deckId, userId),
    getLessonProgressForDeck(deckId, userId),
    getNewVocabCountForDeck(deckId, userId),
  ]);
  if (!deck) return null;
  const limit = requestedSize === 'all' ? availableCount : requestedSize;
  const learnItems = limit > 0 ? await getNewVocabsForDeck(deckId, userId, limit) : [];
  return { deckTitle: deck.title, learnItems, lessonProgress, availableCount };
}

export async function getReviewPageData(
  id: number,
  requestedLimit: number | 'all' = DEFAULT_REVIEW_SESSION_SIZE,
) {
  const deckId = parsePositiveInteger(id);
  if (!deckId) throw new Error('Invalid deck ID.');
  const userId = await getCurrentUserId();
  const limit =
    requestedLimit === 'all'
      ? 'all'
      : REVIEW_SESSION_SIZES.includes(requestedLimit as (typeof REVIEW_SESSION_SIZES)[number])
        ? requestedLimit
        : DEFAULT_REVIEW_SESSION_SIZE;
  if (!(await getActiveReleaseId(deckId, userId))) return null;
  const [deck, dueReviews, nextReview] = await Promise.all([
    getAccessibleDeckById(deckId, userId),
    getDueReviewsForDeck(deckId, userId, limit),
    getNextReviewBatch(userId, [deckId]),
  ]);
  if (!deck) return null;
  return {
    deckTitle: deck.title,
    dueReviews,
    nextReview,
    availableCount: Number(dueReviews[0]?.availableCount ?? 0),
  };
}

export async function getAllReviewsPageData(
  requestedLimit: number | 'all' = DEFAULT_REVIEW_SESSION_SIZE,
) {
  const userId = await getCurrentUserId();
  const limit =
    requestedLimit === 'all'
      ? 'all'
      : REVIEW_SESSION_SIZES.includes(requestedLimit as (typeof REVIEW_SESSION_SIZES)[number])
        ? requestedLimit
        : DEFAULT_REVIEW_SESSION_SIZE;
  const [dueReviews, nextReview, deckBreakdown] = await Promise.all([
    getDueReviews(userId, undefined, limit),
    getNextReviewBatch(userId),
    getDueReviewDeckBreakdown(userId),
  ]);
  return {
    dueReviews,
    nextReview,
    deckBreakdown,
    availableCount: Number(dueReviews[0]?.availableCount ?? 0),
  };
}

export async function getPlacementPageData(deckIdInput: number, lessonIdInput: number) {
  const deckId = parsePositiveInteger(deckIdInput);
  const lessonId = parsePositiveInteger(lessonIdInput);
  if (!deckId || !lessonId) throw new Error('Invalid deck or lesson ID.');
  const userId = await getCurrentUserId();
  if (!(await getActiveReleaseId(deckId, userId))) return null;
  return getPlacementTestVocabs(deckId, lessonId, userId);
}

export async function getRecentMistakes(limit = 25) {
  const normalizedLimit = Math.min(100, Math.max(1, Math.floor(limit)));
  return getRecentMistakeVocabs(await getCurrentUserId(), normalizedLimit);
}

export async function getRecentMistakeCountData() {
  return getRecentMistakeCount(await getCurrentUserId());
}

export async function getNextReviewBatchData(deckIdInput?: number) {
  const deckId = deckIdInput === undefined ? undefined : parsePositiveInteger(deckIdInput);
  if (deckIdInput !== undefined && !deckId) throw new Error('Invalid deck ID.');

  return getNextReviewBatch(await getCurrentUserId(), deckId ? [deckId] : undefined);
}
