'use server';

import { getAccessibleDeckById, getOwnedDeckById } from '@/db/queries/deck.queries';
import { getActiveReleaseId } from '@/db/queries/deck-access';
import { getReleaseLessonVocabs } from '@/db/queries/deck-release.queries';
import { getLessonById } from '@/db/queries/lesson.queries';
import {
  createVocab,
  deleteVocab,
  getVocabByLessonId,
  getUserVocabLevelsByLessonId,
  moveVocab,
  replaceVocab,
  restoreVocab,
  updateVocab,
} from '@/db/queries/vocab.queries';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { CreateVocab, UpdateVocabInput } from '@/types/vocab.types';
import { revalidatePath } from 'next/cache';
import { OrderDirection } from '@/types/order.types';
import { getCurrentUserId } from '@/lib/auth/get-current-user-id';
import { withExpectedError } from '@/lib/action-result';
import { normalizeVocabContent, normalizeVocabUpdate } from '@/lib/vocab/normalize-vocab-content';

export async function getLessonVocabularyAction(deckId: number, lessonId: number) {
  const parsedDeckId = parsePositiveInteger(deckId);
  const parsedLessonId = parsePositiveInteger(lessonId);
  if (!parsedDeckId || !parsedLessonId) {
    throw new Error('Invalid deck or lesson ID.');
  }

  const userId = await getCurrentUserId();
  const [deck, lesson] = await Promise.all([
    getAccessibleDeckById(parsedDeckId, userId),
    getLessonById(parsedLessonId),
  ]);

  if (!deck || !lesson || lesson.deckId !== deck.id) {
    throw new Error('Lesson not found or access denied.');
  }

  const releaseId = await getActiveReleaseId(parsedDeckId, userId, true);
  if (!releaseId) throw new Error('Deck has no accessible release.');
  const [lessonVocabs, userVocabLevels] = await Promise.all([
    getReleaseLessonVocabs(releaseId, parsedLessonId),
    getUserVocabLevelsByLessonId(parsedLessonId, userId),
  ]);

  return {
    vocabs: lessonVocabs,
    srsLevels: Object.fromEntries(userVocabLevels.map(state => [state.vocabId, state.srsLevel])),
  };
}

export async function getEditableLessonVocabularyAction(deckId: number, lessonId: number) {
  const parsedDeckId = parsePositiveInteger(deckId);
  const parsedLessonId = parsePositiveInteger(lessonId);
  if (!parsedDeckId || !parsedLessonId) {
    throw new Error('Invalid deck or lesson ID.');
  }

  const userId = await getCurrentUserId();
  const [deck, lesson] = await Promise.all([
    getOwnedDeckById(parsedDeckId, userId),
    getLessonById(parsedLessonId),
  ]);

  if (!deck || !lesson || lesson.deckId !== deck.id || lesson.removedAt) {
    throw new Error('Lesson not found or access denied.');
  }

  return getVocabByLessonId(parsedLessonId);
}

export async function createVocabAction(vocab: CreateVocab) {
  return withExpectedError(async () => {
    const { lessonId } = vocab;
    if (typeof lessonId !== 'number' || !Number.isInteger(lessonId) || lessonId <= 0) {
      throw new Error('Invalid lesson ID.');
    }

    const deckId = await createVocab(
      {
        lessonId,
        ...normalizeVocabContent(vocab),
      },
      await getCurrentUserId(),
    );
    revalidatePath(`/decks/${deckId}/edit`);
  });
}

export async function moveVocabAction(vocabId: number, direction: OrderDirection) {
  return withExpectedError(async () => {
    if (typeof vocabId !== 'number' || !Number.isInteger(vocabId) || vocabId <= 0) {
      throw new Error('Invalid vocabulary ID.');
    }

    if (direction !== 'up' && direction !== 'down') {
      throw new Error('Invalid move direction.');
    }

    const deckId = await moveVocab(vocabId, await getCurrentUserId(), direction);
    revalidatePath(`/decks/${deckId}`);
    revalidatePath(`/decks/${deckId}/edit`);
  });
}

export async function updateVocabAction(vocabId: number, vocab: UpdateVocabInput) {
  return withExpectedError(async () => {
    if (typeof vocabId !== 'number' || !Number.isInteger(vocabId) || vocabId <= 0) {
      throw new Error('Invalid vocabulary ID.');
    }

    const deckId = await updateVocab(
      vocabId,
      normalizeVocabUpdate(vocab),
      await getCurrentUserId(),
    );

    revalidatePath(`/decks/${deckId}`);
    revalidatePath(`/decks/${deckId}/edit`);
  });
}

export async function deleteVocabAction(vocabId: number) {
  return withExpectedError(async () => {
    const parsedVocabId = parsePositiveInteger(vocabId);
    if (!parsedVocabId) throw new Error('Invalid vocabulary ID.');
    const deckId = await deleteVocab(parsedVocabId, await getCurrentUserId());
    revalidatePath(`/decks/${deckId}`);
    revalidatePath(`/decks/${deckId}/edit`);
  });
}

export async function replaceVocabAction(vocabId: number, vocab: UpdateVocabInput) {
  return withExpectedError(async () => {
    const parsedVocabId = parsePositiveInteger(vocabId);
    if (!parsedVocabId) throw new Error('Invalid vocabulary ID.');
    const normalized = normalizeVocabContent(vocab);
    const result = await replaceVocab(parsedVocabId, normalized, await getCurrentUserId());
    revalidatePath(`/decks/${result.deckId}`);
    revalidatePath(`/decks/${result.deckId}/edit`);
    return result.vocabId;
  });
}

export async function restoreVocabAction(vocabId: number) {
  return withExpectedError(async () => {
    const parsedVocabId = parsePositiveInteger(vocabId);
    if (!parsedVocabId) throw new Error('Invalid vocabulary ID.');
    const deckId = await restoreVocab(parsedVocabId, await getCurrentUserId());
    revalidatePath(`/decks/${deckId}/edit`);
  });
}
