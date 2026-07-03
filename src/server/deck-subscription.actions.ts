'use server';

import { createDeckSubscription } from '@/db/queries/deck-subscription.queries';
import { createClient } from '@/lib/supabase/server';
import { CreateDeckSubscription } from '@/types/deck-subscription.types';

export async function subscribeUserToDeckAction(deckId: number) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error('User must be authenticated to subscribe to a deck.');
  }

  const newDeckSubscription: CreateDeckSubscription = {
    deckId,
    userId: data.user.id,
  };

  await createDeckSubscription(newDeckSubscription);
}
