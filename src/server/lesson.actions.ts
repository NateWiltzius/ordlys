'use server';

import { getDeckById } from '@/db/queries/deck.queries';
import {
  createLesson,
  deleteLesson,
  getLessonById,
  getLessonsByDeckId,
  moveLesson,
} from '@/db/queries/lesson.queries';
import { createClient } from '@/lib/supabase/server';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { CreateLesson, Lesson } from '@/types/lesson.types';
import { revalidatePath } from 'next/cache';
import { OrderDirection } from '@/types/order.types';

export const getLessonsAction = async (deckId: number): Promise<Lesson[]> => {
  const parsedDeckId = parsePositiveInteger(deckId);
  if (!parsedDeckId) {
    throw new Error('Invalid deck ID.');
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error('User must be authenticated to view lessons.');
  }

  const deck = await getDeckById(parsedDeckId);
  if (!deck || deck.deletedAt || deck.ownerId !== data.user.id) {
    throw new Error('Deck not found or access denied.');
  }

  return await getLessonsByDeckId(parsedDeckId);
};

export async function createLessonAction(lesson: CreateLesson) {
  const { title, deckId } = lesson;
  if (typeof title !== 'string' || title.trim().length === 0) {
    return;
  }

  if (typeof deckId !== 'number' || !Number.isInteger(deckId) || deckId <= 0) {
    throw new Error('Invalid deck ID.');
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error('User must be authenticated to create a lesson.');
  }

  const deck = await getDeckById(deckId);
  if (!deck || deck.deletedAt) {
    throw new Error('Deck not found.');
  }

  if (deck.ownerId !== data.user.id) {
    throw new Error('Not authorized to create a lesson for this deck.');
  }

  await createLesson(
    {
      title: title.trim(),
      deckId,
    },
    data.user.id,
  );
  revalidatePath(`/decks/${deckId}/edit`);
}

export async function deleteLessonAction(lessonId: number) {
  if (typeof lessonId !== 'number' || !Number.isInteger(lessonId) || lessonId <= 0) {
    throw new Error('Invalid lesson ID.');
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error('User must be authenticated to delete a lesson.');
  }

  const lesson = await getLessonById(lessonId);
  if (!lesson) {
    throw new Error('Lesson not found.');
  }

  const deck = await getDeckById(lesson.deckId);
  if (!deck || deck.deletedAt) {
    throw new Error('Deck not found.');
  }

  if (deck.ownerId !== data.user.id) {
    throw new Error('Not authorized to delete a lesson for this deck.');
  }

  await deleteLesson(lessonId, data.user.id);
  revalidatePath(`/decks/${lesson.deckId}/edit`);
}

export async function moveLessonAction(lessonId: number, direction: OrderDirection) {
  if (typeof lessonId !== 'number' || !Number.isInteger(lessonId) || lessonId <= 0) {
    throw new Error('Invalid lesson ID.');
  }

  if (direction !== 'up' && direction !== 'down') {
    throw new Error('Invalid move direction.');
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error('User must be authenticated to reorder lessons.');
  }

  const deckId = await moveLesson(lessonId, data.user.id, direction);
  revalidatePath(`/decks/${deckId}`);
  revalidatePath(`/decks/${deckId}/edit`);
}
