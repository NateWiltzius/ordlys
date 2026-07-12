import { decks } from '@/db/schema';

export type Deck = typeof decks.$inferSelect;

export type CreateDeck = typeof decks.$inferInsert;
export type CreateDeckInput = Omit<CreateDeck, 'ownerId'>;
