'use server';

import { SrsTransition } from '@/types/review.types';
import {
  getDueReviewsForDeck,
  getDueReviews,
  getLessonProgressForDeck,
  getNextReviewBatch,
  getNewVocabCountForDeck,
  getNewVocabsForDeck,
  getPlacementTestVocabs,
  placeVocab,
  reviewVocab,
  startVocab,
} from '@/db/queries/review.queries';
import { getCurrentUserId } from '@/lib/auth/get-current-user-id';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { getActiveReleaseId } from '@/db/queries/deck-access';
import {
  getRecentMistakeCount,
  getRecentMistakeVocabs,
  recordReviewAttempt,
} from '@/db/queries/review-attempt.queries';
import type { QuizDirection, StudyMode } from '@/types/quiz.types';
import { DEFAULT_LEARN_SESSION_SIZE, LEARN_SESSION_SIZES } from '@/lib/study-session-size';

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

export async function getReviewPageDataAction(id: number) {
  const deckId = parsePositiveInteger(id);
  if (!deckId) throw new Error('Invalid deck ID.');
  const userId = await getCurrentUserId();
  if (!(await getActiveReleaseId(deckId, userId))) return null;
  const [dueReviews, nextReview] = await Promise.all([
    getDueReviewsForDeck(deckId, userId),
    getNextReviewBatch(userId, [deckId]),
  ]);
  return { dueReviews, nextReview };
}

export async function getAllReviewsPageDataAction() {
  const userId = await getCurrentUserId();
  const [dueReviews, nextReview] = await Promise.all([
    getDueReviews(userId),
    getNextReviewBatch(userId),
  ]);
  return { dueReviews, nextReview };
}

export async function getPlacementPageDataAction(deckIdInput: number, lessonIdInput: number) {
  const deckId = parsePositiveInteger(deckIdInput);
  const lessonId = parsePositiveInteger(lessonIdInput);
  if (!deckId || !lessonId) throw new Error('Invalid deck or lesson ID.');
  const userId = await getCurrentUserId();
  if (!(await getActiveReleaseId(deckId, userId))) return null;
  return getPlacementTestVocabs(deckId, lessonId, userId);
}

export async function startVocabAction(vocabId: number): Promise<SrsTransition> {
  const parsedVocabId = parsePositiveInteger(vocabId);
  if (!parsedVocabId) throw new Error('Invalid vocabulary ID.');
  return startVocab(parsedVocabId, await getCurrentUserId());
}

export async function reviewVocabAction(
  vocabId: number,
  wasCorrect: boolean,
): Promise<SrsTransition> {
  const parsedVocabId = parsePositiveInteger(vocabId);
  if (!parsedVocabId) throw new Error('Invalid vocabulary ID.');
  if (typeof wasCorrect !== 'boolean') throw new Error('Invalid review result.');
  return reviewVocab(parsedVocabId, await getCurrentUserId(), wasCorrect);
}

export async function placeVocabAction(
  vocabId: number,
  wasCorrect: boolean,
): Promise<SrsTransition> {
  const parsedVocabId = parsePositiveInteger(vocabId);
  if (!parsedVocabId) throw new Error('Invalid vocabulary ID.');
  if (typeof wasCorrect !== 'boolean') throw new Error('Invalid placement result.');
  return placeVocab(parsedVocabId, await getCurrentUserId(), wasCorrect);
}

export async function recordReviewAttemptAction(
  vocabId: number,
  mode: StudyMode,
  direction: QuizDirection,
  isCorrect: boolean,
  wasOverridden: boolean,
) {
  const parsedVocabId = parsePositiveInteger(vocabId);
  if (!parsedVocabId) throw new Error('Invalid vocabulary ID.');
  if (!['learn', 'review', 'placement'].includes(mode)) throw new Error('Invalid study mode.');
  if (!['btf', 'ftb'].includes(direction)) throw new Error('Invalid quiz direction.');
  if (typeof isCorrect !== 'boolean' || typeof wasOverridden !== 'boolean') {
    throw new Error('Invalid review attempt.');
  }

  await recordReviewAttempt({
    userId: await getCurrentUserId(),
    vocabId: parsedVocabId,
    mode,
    direction,
    isCorrect,
    wasOverridden,
  });
}

export async function getRecentMistakesAction(limit = 25) {
  const normalizedLimit = Math.min(100, Math.max(1, Math.floor(limit)));
  return getRecentMistakeVocabs(await getCurrentUserId(), normalizedLimit);
}

export async function getRecentMistakeCountAction() {
  return getRecentMistakeCount(await getCurrentUserId());
}
