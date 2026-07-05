'use server';

import { createLesson, deleteLesson, moveLesson } from '@/db/queries/lesson.queries';
import { CreateLesson } from '@/types/lesson.types';
import { revalidatePath } from 'next/cache';
import { OrderDirection } from '@/types/order.types';
import { getCurrentUserId } from '@/lib/auth/get-current-user-id';
import { CONTENT_LIMITS, requiredText } from '@/lib/validation/content';

export async function createLessonAction(lesson: CreateLesson) {
  const { title, deckId } = lesson;
  const normalizedTitle = requiredText(title, 'Lesson title', CONTENT_LIMITS.lessonTitle);

  if (typeof deckId !== 'number' || !Number.isInteger(deckId) || deckId <= 0) {
    throw new Error('Invalid deck ID.');
  }

  await createLesson(
    {
      title: normalizedTitle,
      deckId,
    },
    await getCurrentUserId(),
  );
  revalidatePath(`/decks/${deckId}/edit`);
}

export async function deleteLessonAction(lessonId: number) {
  if (typeof lessonId !== 'number' || !Number.isInteger(lessonId) || lessonId <= 0) {
    throw new Error('Invalid lesson ID.');
  }

  const deckId = await deleteLesson(lessonId, await getCurrentUserId());
  revalidatePath(`/decks/${deckId}/edit`);
}

export async function moveLessonAction(lessonId: number, direction: OrderDirection) {
  if (typeof lessonId !== 'number' || !Number.isInteger(lessonId) || lessonId <= 0) {
    throw new Error('Invalid lesson ID.');
  }

  if (direction !== 'up' && direction !== 'down') {
    throw new Error('Invalid move direction.');
  }

  const deckId = await moveLesson(lessonId, await getCurrentUserId(), direction);
  revalidatePath(`/decks/${deckId}`);
  revalidatePath(`/decks/${deckId}/edit`);
}
