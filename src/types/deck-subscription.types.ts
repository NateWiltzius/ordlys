import { deckSubscriptions } from '@/db/schema';

export type CreateDeckSubscription = typeof deckSubscriptions.$inferInsert;
