import type { deckFollows, deckReleases } from '@/db/schema';

export type DeckRelease = typeof deckReleases.$inferSelect;
export type DeckFollow = typeof deckFollows.$inferSelect;
export type FollowUpdateMode = DeckFollow['updateMode'];
export type FollowStatus = DeckFollow['status'];
