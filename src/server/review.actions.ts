'use server';

import {
  getDueReviewsForDeck,
  getDueReviews,
  getLessonProgressForDeck,
  getNextReviewBatch,
  getNewVocabCountForDeck,
  getNewVocabsForDeck,
  getPlacementTestVocabs,
  saveQuizAttempt,
} from '@/db/queries/review.queries';
import { getCurrentUserId } from '@/lib/auth/get-current-user-id';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { getActiveReleaseId } from '@/db/queries/deck-access';
import { getRecentMistakeCount, getRecentMistakeVocabs } from '@/db/queries/review-attempt.queries';
import type { SaveQuizAttemptInput } from '@/types/quiz.types';
import {
  DEFAULT_LEARN_SESSION_SIZE,
  DEFAULT_REVIEW_SESSION_SIZE,
  LEARN_SESSION_SIZES,
  REVIEW_SESSION_SIZES,
} from '@/lib/study-session-size';

export async function getLessonProgressForDeckAction(id: number) {
  const deckId = parsePositiveInteger(id);
  if (!deckId) throw new Error('Invalid deck ID.');
  return getLessonProgressForDeck(deckId, await getCurrentUserId());
}

export async function getLearnPageDataAction(
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
  const [lessonProgress, availableCount] = await Promise.all([
    getLessonProgressForDeck(deckId, userId),
    getNewVocabCountForDeck(deckId, userId),
  ]);
  const limit = requestedSize === 'all' ? availableCount : requestedSize;
  const learnItems = limit > 0 ? await getNewVocabsForDeck(deckId, userId, limit) : [];
  return { learnItems, lessonProgress, availableCount };
}

export async function getReviewPageDataAction(
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
  const [dueReviews, nextReview] = await Promise.all([
    getDueReviewsForDeck(deckId, userId, limit),
    getNextReviewBatch(userId, [deckId]),
  ]);
  return { dueReviews, nextReview, availableCount: Number(dueReviews[0]?.availableCount ?? 0) };
}

export async function getAllReviewsPageDataAction(
  requestedLimit: number | 'all' = DEFAULT_REVIEW_SESSION_SIZE,
) {
  const userId = await getCurrentUserId();
  const limit =
    requestedLimit === 'all'
      ? 'all'
      : REVIEW_SESSION_SIZES.includes(requestedLimit as (typeof REVIEW_SESSION_SIZES)[number])
        ? requestedLimit
        : DEFAULT_REVIEW_SESSION_SIZE;
  const [dueReviews, nextReview] = await Promise.all([
    getDueReviews(userId, undefined, limit),
    getNextReviewBatch(userId),
  ]);
  return { dueReviews, nextReview, availableCount: Number(dueReviews[0]?.availableCount ?? 0) };
}

export async function getPlacementPageDataAction(deckIdInput: number, lessonIdInput: number) {
  const deckId = parsePositiveInteger(deckIdInput);
  const lessonId = parsePositiveInteger(lessonIdInput);
  if (!deckId || !lessonId) throw new Error('Invalid deck or lesson ID.');
  const userId = await getCurrentUserId();
  if (!(await getActiveReleaseId(deckId, userId))) return null;
  return getPlacementTestVocabs(deckId, lessonId, userId);
}

export async function saveQuizAttemptAction(input: SaveQuizAttemptInput) {
  const parsedVocabId = parsePositiveInteger(input.vocabId);
  if (!parsedVocabId) throw new Error('Invalid vocabulary ID.');
  if (!['learn', 'review', 'placement'].includes(input.mode)) {
    throw new Error('Invalid study mode.');
  }
  if (!['btf', 'ftb'].includes(input.direction)) throw new Error('Invalid quiz direction.');
  if (
    typeof input.isCorrect !== 'boolean' ||
    typeof input.wasOverridden !== 'boolean' ||
    typeof input.completesCard !== 'boolean' ||
    typeof input.cardWasCorrect !== 'boolean' ||
    !/^[a-zA-Z0-9_-]{16,128}$/.test(input.idempotencyKey)
  ) {
    throw new Error('Invalid review attempt.');
  }

  return saveQuizAttempt(await getCurrentUserId(), { ...input, vocabId: parsedVocabId });
}

export async function getRecentMistakesAction(limit = 25) {
  const normalizedLimit = Math.min(100, Math.max(1, Math.floor(limit)));
  return getRecentMistakeVocabs(await getCurrentUserId(), normalizedLimit);
}

export async function getRecentMistakeCountAction() {
  return getRecentMistakeCount(await getCurrentUserId());
}
