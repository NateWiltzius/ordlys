'use server';

import { SrsTransition } from '@/types/review.types';
import {
  getDueReviewsForDeck,
  getLessonProgressForDeck,
  getNextReviewBatch,
  getNewVocabsForDeck,
  getPlacementTestVocabs,
  placeVocab,
  reviewVocab,
  startVocab,
} from '@/db/queries/review.queries';
import { getCurrentUserId } from '@/lib/auth/get-current-user-id';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { getActiveReleaseId } from '@/db/queries/deck-access';

export async function getLessonProgressForDeckAction(id: number) {
  const deckId = parsePositiveInteger(id);
  if (!deckId) throw new Error('Invalid deck ID.');
  return getLessonProgressForDeck(deckId, await getCurrentUserId());
}

export async function getLearnPageDataAction(id: number) {
  const deckId = parsePositiveInteger(id);
  if (!deckId) throw new Error('Invalid deck ID.');
  const userId = await getCurrentUserId();
  if (!(await getActiveReleaseId(deckId, userId))) return null;
  const [learnItems, lessonProgress] = await Promise.all([
    getNewVocabsForDeck(deckId, userId, 5),
    getLessonProgressForDeck(deckId, userId),
  ]);
  return { learnItems, lessonProgress };
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
