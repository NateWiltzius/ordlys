'use server';

import { saveQuizAttempt } from '@/db/queries/review.queries';
import { getCurrentUserId } from '@/lib/auth/get-current-user-id';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import type { SaveQuizAttemptInput } from '@/types/quiz.types';
import { revalidatePath } from 'next/cache';
import { isUuid } from '@/lib/validation/uuid';

export async function saveQuizAttemptAction(input: SaveQuizAttemptInput) {
  const parsedVocabId = parsePositiveInteger(input.vocabId);
  if (!parsedVocabId) throw new Error('Invalid vocabulary ID.');
  if (!['learn', 'review', 'placement'].includes(input.mode)) {
    throw new Error('Invalid study mode.');
  }
  if (!['btf', 'ftb'].includes(input.direction)) throw new Error('Invalid quiz direction.');
  if (
    typeof input.isCorrect !== 'boolean' ||
    typeof input.wasOverridden !== 'boolean' ||
    !isUuid(input.sessionId) ||
    !/^[a-zA-Z0-9_-]{16,128}$/.test(input.idempotencyKey)
  ) {
    throw new Error('Invalid review attempt.');
  }

  const result = await saveQuizAttempt(await getCurrentUserId(), {
    ...input,
    vocabId: parsedVocabId,
  });

  if (result.transition && result.deckId) {
    revalidatePath('/dashboard');
    revalidatePath('/progress');
    revalidatePath('/decks');
    revalidatePath(`/decks/${result.deckId}`);
    revalidatePath('/review');
    revalidatePath(`/decks/${result.deckId}/review`);
    revalidatePath(`/decks/${result.deckId}/learn`);
  }

  return result;
}
