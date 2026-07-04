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

export async function getNewVocabsForDeckAction(deckId: number, limit = 5): Promise<LearnItem[]> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user || !data.user.id) {
    throw new Error('User not authenticated');
  }

  return await getNewVocabsForDeck(deckId, data.user.id, limit);
}

export async function getDueReviewsForDeckAction(deckId: number): Promise<ReviewItem[]> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user || !data.user.id) {
    throw new Error('User not authenticated');
  }

  return await getDueReviewsForDeck(deckId, data.user.id);
}

export async function getPlacementTestVocabsAction(deckId: number, lessonId: number) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user || !data.user.id) {
    throw new Error('User not authenticated');
  }

  return await getPlacementTestVocabs(deckId, lessonId, data.user.id);
}

export async function getLessonProgressForDeckAction(deckId: number): Promise<LessonProgress[]> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user || !data.user.id) {
    throw new Error('User not authenticated');
  }

  return await getLessonProgressForDeck(deckId, data.user.id);
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
