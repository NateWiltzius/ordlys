import { db } from '@/db';
import { decks } from '@/db/schema';
import { CreateDeck, DeleteDeck } from '@/types/deck.types';
import { eq } from 'drizzle-orm';

export const createDeck = async (deck: CreateDeck) => {
  await db.insert(decks).values({
    name: deck.name,
  });
};

export const getDecks = async () => {
  return await db.select().from(decks);
};

export const deleteDeck = async (deck: DeleteDeck) => {
  await db.delete(decks).where(eq(decks.id, deck.id));
};
