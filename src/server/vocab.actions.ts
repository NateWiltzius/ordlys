'use server';

import {
  createVocab,
  createVocabs,
  deleteVocab,
  moveVocab,
  moveVocabToPosition,
  replaceVocab,
  restoreVocab,
  updateVocab,
} from '@/db/queries/vocab.queries';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { BulkCreateVocabInput, CreateVocab, UpdateVocabInput } from '@/types/vocab.types';
import { revalidatePath } from 'next/cache';
import { OrderDirection } from '@/types/order.types';
import { getCurrentUserId } from '@/lib/auth/get-current-user-id';
import { withExpectedError } from '@/lib/action-result';
import { normalizeVocabContent, normalizeVocabUpdate } from '@/lib/vocab/normalize-vocab-content';

export async function createVocabAction(vocab: CreateVocab) {
  return withExpectedError(async () => {
    const { lessonId } = vocab;
    if (typeof lessonId !== 'number' || !Number.isInteger(lessonId) || lessonId <= 0) {
      throw new Error('Invalid lesson ID.');
    }

    await createVocab(
      {
        lessonId,
        ...normalizeVocabContent(vocab),
      },
      await getCurrentUserId(),
    );
  });
}

export async function createVocabsAction(lessonId: number, cards: BulkCreateVocabInput[]) {
  return withExpectedError(async () => {
    if (typeof lessonId !== 'number' || !Number.isInteger(lessonId) || lessonId <= 0) {
      throw new Error('Invalid lesson ID.');
    }
    if (!Array.isArray(cards) || cards.length === 0 || cards.length > 100) {
      throw new Error('Create between 1 and 100 cards at a time.');
    }

    const normalizedCards = cards.map(card => normalizeVocabContent(card));
    const result = await createVocabs(lessonId, normalizedCards, await getCurrentUserId());
    return result.vocabIds;
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
  });
}

export async function moveVocabToPositionAction(vocabId: number, position: number) {
  return withExpectedError(async () => {
    const parsedVocabId = parsePositiveInteger(vocabId);
    const parsedPosition = parsePositiveInteger(position);
    if (!parsedVocabId) throw new Error('Invalid vocabulary ID.');
    if (!parsedPosition) throw new Error('Invalid vocabulary position.');

    const deckId = await moveVocabToPosition(
      parsedVocabId,
      await getCurrentUserId(),
      parsedPosition - 1,
    );
    revalidatePath(`/decks/${deckId}`);
  });
}

export async function updateVocabAction(vocabId: number, vocab: UpdateVocabInput) {
  return withExpectedError(async () => {
    if (typeof vocabId !== 'number' || !Number.isInteger(vocabId) || vocabId <= 0) {
      throw new Error('Invalid vocabulary ID.');
    }

    await updateVocab(vocabId, normalizeVocabUpdate(vocab), await getCurrentUserId());
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
