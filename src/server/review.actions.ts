'use server';

import { LearnItem, ReviewItem, SrsTransition } from '@/types/review.types';
import { createClient } from '@/lib/supabase/server';
import {
  getDueReviewsForDeck,
  getLessonProgressForDeck,
  getNewVocabsForDeck,
  getPlacementTestVocabs,
  placeVocab,
  reviewVocab,
  startVocab,
} from '@/db/queries/review.queries';
import { LessonProgress } from '@/types/review.types';
import { getCurrentUserId } from '@/lib/auth/get-current-user-id';

export async function getNewVocabsForDeckAction(deckId: number, limit = 5): Promise<LearnItem[]> {
  return await getNewVocabsForDeck(deckId, await getCurrentUserId(), limit);
}

export async function getDueReviewsForDeckAction(deckId: number): Promise<ReviewItem[]> {
  return await getDueReviewsForDeck(deckId, await getCurrentUserId());
}

export async function getPlacementTestVocabsAction(deckId: number, lessonId: number) {
  return await getPlacementTestVocabs(deckId, lessonId, await getCurrentUserId());
}

export async function getLessonProgressForDeckAction(deckId: number): Promise<LessonProgress[]> {
  return await getLessonProgressForDeck(deckId, await getCurrentUserId());
}

export async function startVocabAction(vocabId: number): Promise<SrsTransition> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user || !data.user.id) {
    throw new Error('User not authenticated');
  }

  return await startVocab(vocabId, data.user.id);
}

export async function reviewVocabAction(
  vocabId: number,
  wasCorrect: boolean,
): Promise<SrsTransition> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user || !data.user.id) {
    throw new Error('User not authenticated');
  }

  return await reviewVocab(vocabId, data.user.id, wasCorrect);
}

export async function placeVocabAction(
  vocabId: number,
  wasCorrect: boolean,
): Promise<SrsTransition> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user || !data.user.id) {
    throw new Error('User not authenticated');
  }

  return await placeVocab(vocabId, data.user.id, wasCorrect);
}
