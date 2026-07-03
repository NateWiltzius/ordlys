import { deckSubscriptions } from '@/db/schema';

export type DeckSubscription = typeof deckSubscriptions.$inferSelect;

export type CreateDeckSubscription = typeof deckSubscriptions.$inferInsert;
