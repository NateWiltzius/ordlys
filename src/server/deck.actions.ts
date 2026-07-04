'use server';

import {
  createDeck,
  deleteDeck,
  updateDeck,
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
import { CONTENT_LIMITS, optionalText, requiredText } from '@/lib/validation/content';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';

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
  const [ownedDecks, publicDecks, learningDecks] = await Promise.all([
    getDecksByOwnerId(userId),
    getPublicDecks(userId),
    getUserSubscribedDecks(userId),
  ]);

  return { ownedDecks, publicDecks, learningDecks };
}

export const createDeckAction = async (deck: CreateDeckInput): Promise<void> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error('User must be authenticated to create a deck.');
  }

  if (!deck || typeof deck !== 'object') throw new Error('Invalid deck.');
  if (deck.visibility !== 'public' && deck.visibility !== 'private') {
    throw new Error('Visibility must be public or private.');
  }
  const deckWithOwner: CreateDeck = {
    title: requiredText(deck.title, 'Deck title', CONTENT_LIMITS.deckTitle),
    description: optionalText(deck.description, 'Description', CONTENT_LIMITS.deckDescription),
    visibility: deck.visibility,
    ownerId: data.user.id,
  };

  await createDeck(deckWithOwner);
  revalidatePath('/decks');
};

export async function updateDeckAction(id: number, input: CreateDeckInput): Promise<void> {
  const deckId = parsePositiveInteger(id);
  if (!deckId || !input || typeof input !== 'object') throw new Error('Invalid deck.');
  if (input.visibility !== 'public' && input.visibility !== 'private') {
    throw new Error('Visibility must be public or private.');
  }
  const userId = await getCurrentUserId();
  await updateDeck(deckId, userId, {
    title: requiredText(input.title, 'Deck title', CONTENT_LIMITS.deckTitle),
    description: optionalText(input.description, 'Description', CONTENT_LIMITS.deckDescription),
    visibility: input.visibility,
  });
  revalidatePath('/decks');
  revalidatePath(`/decks/${deckId}`);
  revalidatePath(`/decks/${deckId}/edit`);
}

export const getDecksByOwnerIdAction = async (): Promise<Deck[]> => {
  return await getDecksByOwnerId(await getCurrentUserId());
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
