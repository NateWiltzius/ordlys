'use server';

import { getDeckById } from '@/db/queries/deck.queries';
import {
  createLesson,
  deleteLesson,
  getLessonById,
  getLessonsByDeckId,
} from '@/db/queries/lesson.queries';
import { createClient } from '@/lib/supabase/server';
import { CreateLesson, Lesson } from '@/types/lesson.types';
import { revalidateTag, unstable_cache } from 'next/cache';

const LESSONS_CACHE_TAG = 'lessons';

const getCachedLessons = (deckId: number): (() => Promise<Lesson[]>) =>
  unstable_cache(
    async () => {
      return await getLessonsByDeckId(deckId);
    },
    ['lessons-list', String(deckId)],
    {
      tags: [`${LESSONS_CACHE_TAG}-${deckId}`],
      revalidate: 1,
    },
  );

export const getLessonsAction = async (deckId: number): Promise<Lesson[]> => {
  return await getCachedLessons(deckId)();
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
  if (!deck) {
    throw new Error('Deck not found.');
  }

  if (deck.ownerId !== data.user.id) {
    throw new Error('Not authorized to create a lesson for this deck.');
  }

  await createLesson({
    title: title.trim(),
    deckId,
  });
  revalidateTag(`${LESSONS_CACHE_TAG}-${deckId}`);
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
  if (!deck) {
    throw new Error('Deck not found.');
  }

  if (deck.ownerId !== data.user.id) {
    throw new Error('Not authorized to delete a lesson for this deck.');
  }

  await deleteLesson(lessonId);
  revalidateTag(`${LESSONS_CACHE_TAG}-${lesson.deckId}`);
}
