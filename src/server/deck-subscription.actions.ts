'use server';

import {
  createDeckSubscription,
  deleteDeckSubscription,
} from '@/db/queries/deck-subscription.queries';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { CreateDeckSubscription } from '@/types/deck-subscription.types';
import { revalidatePath } from 'next/cache';
import { getCurrentUserId } from '@/lib/auth/get-current-user-id';

export async function subscribeUserToDeckAction(deckId: number) {
  const parsedDeckId = parsePositiveInteger(deckId);
  if (!parsedDeckId) {
    throw new Error('Invalid deck ID.');
  }

  const userId = await getCurrentUserId();

  const newDeckSubscription: CreateDeckSubscription = {
    deckId: parsedDeckId,
    userId,
  };

  await createDeckSubscription(newDeckSubscription);
  revalidatePath('/decks');
  revalidatePath(`/decks/${parsedDeckId}`);
  revalidatePath('/');
}

export async function unsubscribeUserFromDeckAction(deckId: number) {
  const parsedDeckId = parsePositiveInteger(deckId);
  if (!parsedDeckId) {
    throw new Error('Invalid deck ID.');
  }

  await deleteDeckSubscription(parsedDeckId, await getCurrentUserId());
  revalidatePath('/decks');
  revalidatePath(`/decks/${parsedDeckId}`);
  revalidatePath('/');
}
