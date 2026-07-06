'use server';

import { SrsTransition } from '@/types/review.types';
import {
  getDueReviewsForDeck,
  getLessonProgressForDeck,
  getNewVocabsForDeck,
  getPlacementTestVocabs,
  placeVocab,
  reviewVocab,
  startVocab,
} from '@/db/queries/review.queries';
import { getCurrentUserId } from '@/lib/auth/get-current-user-id';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { canStudyDeck } from '@/db/queries/deck-subscription.queries';

export async function getLessonProgressForDeckAction(id: number) {
  const deckId = parsePositiveInteger(id);
  if (!deckId) throw new Error('Invalid deck ID.');
  return await getLessonProgressForDeck(deckId, await getCurrentUserId());
}

export async function getLearnPageDataAction(id: number) {
  const deckId = parsePositiveInteger(id);
  if (!deckId) throw new Error('Invalid deck ID.');
  const userId = await getCurrentUserId();
  if (!(await canStudyDeck(deckId, userId))) return null;
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
  if (!(await canStudyDeck(deckId, userId))) return null;
  return await getDueReviewsForDeck(deckId, userId);
}

export async function getPlacementPageDataAction(deckIdInput: number, lessonIdInput: number) {
  const deckId = parsePositiveInteger(deckIdInput);
  const lessonId = parsePositiveInteger(lessonIdInput);
  if (!deckId || !lessonId) throw new Error('Invalid deck or lesson ID.');
  const userId = await getCurrentUserId();
  if (!(await canStudyDeck(deckId, userId))) return null;
  return await getPlacementTestVocabs(deckId, lessonId, userId);
}

export async function startVocabAction(vocabId: number): Promise<SrsTransition> {
  const parsedVocabId = parsePositiveInteger(vocabId);
  if (!parsedVocabId) throw new Error('Invalid vocabulary ID.');
  return await startVocab(parsedVocabId, await getCurrentUserId());
}

export async function reviewVocabAction(
  vocabId: number,
  wasCorrect: boolean,
): Promise<SrsTransition> {
  const parsedVocabId = parsePositiveInteger(vocabId);
  if (!parsedVocabId) throw new Error('Invalid vocabulary ID.');
  if (typeof wasCorrect !== 'boolean') throw new Error('Invalid review result.');
  return await reviewVocab(parsedVocabId, await getCurrentUserId(), wasCorrect);
}

export async function placeVocabAction(
  vocabId: number,
  wasCorrect: boolean,
): Promise<SrsTransition> {
  const parsedVocabId = parsePositiveInteger(vocabId);
  if (!parsedVocabId) throw new Error('Invalid vocabulary ID.');
  if (typeof wasCorrect !== 'boolean') throw new Error('Invalid placement result.');
  return await placeVocab(parsedVocabId, await getCurrentUserId(), wasCorrect);
}
