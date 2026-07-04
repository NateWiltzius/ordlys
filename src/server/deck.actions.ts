'use server';

import {
  createDeck,
  deleteDeck,
  getAllDecksStudyCounts,
  getDeckById,
  getDeckCardStudyCounts,
  getDecksByOwnerId,
  getDeckStudyCounts,
  getPublicDecks,
  getUserActiveDecks,
  getUserSubscribedDecks,
} from '@/db/queries/deck.queries';
import { createClient } from '@/lib/supabase/server';
import { CreateDeck, CreateDeckInput, Deck } from '@/types/deck.types';
import { ReviewCounts } from '@/types/review.types';
import { revalidatePath } from 'next/cache';
import { getCurrentUserId } from '@/lib/auth/get-current-user-id';

export async function getDashboardDataAction() {
  const userId = await getCurrentUserId();
  const activeDecks = await getUserActiveDecks(userId);
  const activeDeckIds = activeDecks.map(deck => deck.id);
  const [allDeckStats, deckStats] = await Promise.all([
    getAllDecksStudyCounts(userId, activeDeckIds),
    getDeckCardStudyCounts(activeDeckIds, userId),
  ]);

  return { activeDecks, allDeckStats, deckStats };
}

export async function getDecksPageDataAction() {
  const userId = await getCurrentUserId();
  const [ownedDecks, publicDecks, subscribedDecks] = await Promise.all([
    getDecksByOwnerId(userId),
    getPublicDecks(userId),
    getUserSubscribedDecks(userId),
  ]);

  return { ownedDecks, publicDecks, subscribedDecks };
}

export const createDeckAction = async (deck: CreateDeckInput): Promise<void> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error('User must be authenticated to create a deck.');
  }

  const deckWithOwner: CreateDeck = {
    ...deck,
    ownerId: data.user.id,
  };

  await createDeck(deckWithOwner);
  revalidatePath('/decks');
};

export const getDecksByOwnerIdAction = async (): Promise<Deck[]> => {
  return await getDecksByOwnerId(await getCurrentUserId());
};

export const getUserSubscribedDecksAction = async (): Promise<Deck[]> => {
  return await getUserSubscribedDecks(await getCurrentUserId());
};

export const getUserActiveDecksAction = async (): Promise<Deck[]> => {
  return await getUserActiveDecks(await getCurrentUserId());
};

export const getPublicDecksAction = async (): Promise<Deck[]> => {
  return await getPublicDecks(await getCurrentUserId());
};

export const deleteDeckAction = async (id: number): Promise<void> => {
  if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
    throw new Error('Invalid deck ID.');
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error('User must be authenticated to delete a deck.');
  }

  const deck = await getDeckById(id);
  if (!deck) {
    throw new Error('Deck not found.');
  }

  if (deck.ownerId !== data.user.id) {
    throw new Error('Not authorized to delete this deck.');
  }

  await deleteDeck(id, data.user.id);
  revalidatePath('/decks');
  revalidatePath('/dashboard');
};

export async function getDeckStudyCountsAction(deckId: number): Promise<ReviewCounts> {
  return await getDeckStudyCounts(deckId, await getCurrentUserId());
}

export async function getAllDecksStudyCountsAction(): Promise<ReviewCounts> {
  return await getAllDecksStudyCounts(await getCurrentUserId());
}
