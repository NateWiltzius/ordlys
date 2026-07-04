'use server';

import { createDeckSubscription } from '@/db/queries/deck-subscription.queries';
import { getDeckById } from '@/db/queries/deck.queries';
import { createClient } from '@/lib/supabase/server';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { CreateDeckSubscription } from '@/types/deck-subscription.types';
import { revalidatePath } from 'next/cache';

export async function subscribeUserToDeckAction(deckId: number) {
  const parsedDeckId = parsePositiveInteger(deckId);
  if (!parsedDeckId) {
    throw new Error('Invalid deck ID.');
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error('User must be authenticated to subscribe to a deck.');
  }

  const deck = await getDeckById(parsedDeckId);
  if (!deck || deck.visibility !== 'public') {
    throw new Error('Deck not found or unavailable for subscription.');
  }

  if (deck.ownerId === data.user.id) {
    throw new Error('You cannot subscribe to your own deck.');
  }

  const newDeckSubscription: CreateDeckSubscription = {
    deckId: parsedDeckId,
    userId: data.user.id,
  };

  await createDeckSubscription(newDeckSubscription);
  revalidatePath('/decks');
  revalidatePath(`/decks/${parsedDeckId}`);
  revalidatePath('/dashboard');
}
