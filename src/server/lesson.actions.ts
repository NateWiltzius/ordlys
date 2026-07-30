'use server';

import {
  createLesson,
  deleteLesson,
  moveLesson,
  restoreLesson,
  updateLesson,
} from '@/db/queries/lesson.queries';
import { CreateLesson } from '@/types/lesson.types';
import { revalidatePath } from 'next/cache';
import { OrderDirection } from '@/types/order.types';
import { getCurrentUserId } from '@/lib/auth/get-current-user-id';
import { CONTENT_LIMITS, requiredText } from '@/lib/validation/content';
import { withExpectedError } from '@/lib/action-result';

export async function createLessonAction(lesson: CreateLesson) {
  return withExpectedError(async () => {
    const { title, deckId } = lesson;
    const normalizedTitle = requiredText(title, 'Lesson title', CONTENT_LIMITS.lessonTitle);

    if (typeof deckId !== 'number' || !Number.isInteger(deckId) || deckId <= 0) {
      throw new Error('Invalid deck ID.');
    }

    const lessonId = await createLesson(
      {
        title: normalizedTitle,
        deckId,
      },
      await getCurrentUserId(),
    );
    revalidatePath(`/decks/${deckId}/edit`);
    return lessonId;
  });
}

export async function deleteLessonAction(lessonId: number) {
  return withExpectedError(async () => {
    if (typeof lessonId !== 'number' || !Number.isInteger(lessonId) || lessonId <= 0) {
      throw new Error('Invalid lesson ID.');
    }

    const deckId = await deleteLesson(lessonId, await getCurrentUserId());
    revalidatePath(`/decks/${deckId}/edit`);
  });
}

export async function updateLessonAction(lessonId: number, title: string) {
  return withExpectedError(async () => {
    if (!parsePositiveLessonId(lessonId)) throw new Error('Invalid lesson ID.');
    const deckId = await updateLesson(
      lessonId,
      requiredText(title, 'Lesson title', CONTENT_LIMITS.lessonTitle),
      await getCurrentUserId(),
    );
    revalidatePath(`/decks/${deckId}/edit`);
  });
}

export async function restoreLessonAction(lessonId: number) {
  return withExpectedError(async () => {
    if (!parsePositiveLessonId(lessonId)) throw new Error('Invalid lesson ID.');
    const deckId = await restoreLesson(lessonId, await getCurrentUserId());
    revalidatePath(`/decks/${deckId}/edit`);
  });
}

function parsePositiveLessonId(value: number) {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

export async function moveLessonAction(lessonId: number, direction: OrderDirection) {
  return withExpectedError(async () => {
    if (typeof lessonId !== 'number' || !Number.isInteger(lessonId) || lessonId <= 0) {
      throw new Error('Invalid lesson ID.');
    }

    if (direction !== 'up' && direction !== 'down') {
      throw new Error('Invalid move direction.');
    }

    const deckId = await moveLesson(lessonId, await getCurrentUserId(), direction);
    revalidatePath(`/decks/${deckId}`);
  });
}
