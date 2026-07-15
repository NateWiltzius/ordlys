'use server';

import { followDeck, unfollowDeck } from '@/db/queries/deck-release.queries';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getCurrentUserId } from '@/lib/auth/get-current-user-id';
import { withExpectedError } from '@/lib/action-result';
import { PUBLIC_DECK_SUMMARIES_CACHE_TAG } from '@/lib/cache-tags';

export async function followDeckAction(deckId: number) {
  return withExpectedError(async () => {
    const parsedDeckId = parsePositiveInteger(deckId);
    if (!parsedDeckId) {
      throw new Error('Invalid deck ID.');
    }

    await followDeck(parsedDeckId, await getCurrentUserId());
    revalidateTag(PUBLIC_DECK_SUMMARIES_CACHE_TAG);
    revalidatePath('/decks');
    revalidatePath('/discover');
    revalidatePath(`/decks/${parsedDeckId}`);
    revalidatePath('/dashboard');
  });
}

export async function unfollowDeckAction(deckId: number) {
  return withExpectedError(async () => {
    const parsedDeckId = parsePositiveInteger(deckId);
    if (!parsedDeckId) {
      throw new Error('Invalid deck ID.');
    }

    await unfollowDeck(parsedDeckId, await getCurrentUserId());
    revalidateTag(PUBLIC_DECK_SUMMARIES_CACHE_TAG);
    revalidatePath('/decks');
    revalidatePath('/discover');
    revalidatePath(`/decks/${parsedDeckId}`);
    revalidatePath('/dashboard');
  });
}
