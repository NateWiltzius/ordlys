import type { deckReleases } from '@/db/schema';

export type DeckRelease = typeof deckReleases.$inferSelect;
