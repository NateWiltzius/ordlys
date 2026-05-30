'use server';

import { createDeck, deleteDeck, getDecks } from '@/db/queries/deck.queries';
import { CreateDeck, Deck, DeleteDeck } from '@/types/deck.types';
import { revalidateTag, unstable_cache } from 'next/cache';

const DECKS_CACHE_TAG = 'decks';

const getCachedDecks = unstable_cache(
  async () => {
    return (await getDecks()) as Deck[];
  },
  ['decks-list'],
  { tags: [DECKS_CACHE_TAG] },
);

export const createDeckAction = async () => {
  await createDeck({ name: 'New Deck' } as CreateDeck);
  revalidateTag(DECKS_CACHE_TAG);
};

export const getDecksAction = async () => {
  return await getCachedDecks();
};

export const deleteDeckAction = async (id: number) => {
  await deleteDeck({ id } as DeleteDeck);
  revalidateTag(DECKS_CACHE_TAG);
};
