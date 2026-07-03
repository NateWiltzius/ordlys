import { decks, visibilityEnum } from '@/db/schema';

export type DeckVisibility = (typeof visibilityEnum.enumValues)[number];

export type Deck = typeof decks.$inferSelect;

export type CreateDeck = typeof decks.$inferInsert;
export type CreateDeckInput = Omit<CreateDeck, 'ownerId'>;
