'use server';

import { followDeck, unfollowDeck } from '@/db/queries/deck-release.queries';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { revalidatePath } from 'next/cache';
import { getCurrentUserId } from '@/lib/auth/get-current-user-id';

export async function followDeckAction(deckId: number) {
  const parsedDeckId = parsePositiveInteger(deckId);
  if (!parsedDeckId) {
    throw new Error('Invalid deck ID.');
  }

  await followDeck(parsedDeckId, await getCurrentUserId());
  revalidatePath('/decks');
  revalidatePath(`/decks/${parsedDeckId}`);
  revalidatePath('/dashboard');
}

export async function unfollowDeckAction(deckId: number) {
  const parsedDeckId = parsePositiveInteger(deckId);
  if (!parsedDeckId) {
    throw new Error('Invalid deck ID.');
  }

  await unfollowDeck(parsedDeckId, await getCurrentUserId());
  revalidatePath('/decks');
  revalidatePath(`/decks/${parsedDeckId}`);
  revalidatePath('/dashboard');
}
