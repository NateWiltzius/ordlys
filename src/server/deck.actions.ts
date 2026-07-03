'use server';

import {
  createDeck,
  deleteDeck,
  getAllDecksStudyCounts,
  getDeckById,
  getDecksByOwnerId,
  getDeckStudyCounts,
  getPublicDecks,
  getUserSubscribedDecks,
} from '@/db/queries/deck.queries';
import { createClient } from '@/lib/supabase/server';
import { CreateDeck, CreateDeckInput, Deck } from '@/types/deck.types';
import { ReviewCounts } from '@/types/review.types';
import { revalidatePath } from 'next/cache';

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
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error('User must be authenticated to view their decks.');
  }

  return await getDecksByOwnerId(data.user.id);
};

export const getUserSubscribedDecksAction = async (): Promise<Deck[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error('User must be authenticated to view their subscribed decks.');
  }

  return await getUserSubscribedDecks(data.user.id);
};

export const getPublicDecksAction = async (): Promise<Deck[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error('User must be authenticated to view public decks.');
  }

  return await getPublicDecks();
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

  await deleteDeck(id);
  revalidatePath('/decks');
  revalidatePath('/dashboard');
};

export async function getDeckStudyCountsAction(deckId: number): Promise<ReviewCounts> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user || !data.user.id) {
    throw new Error('User not authenticated');
  }

  return await getDeckStudyCounts(deckId, data.user.id);
}

export async function getAllDecksStudyCountsAction(): Promise<ReviewCounts> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user || !data.user.id) {
    throw new Error('User not authenticated');
  }

  return await getAllDecksStudyCounts(data.user.id);
}
