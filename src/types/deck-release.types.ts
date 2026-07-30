import type { deckReleases } from '@/db/schema';

export type DeckRelease = Pick<
  typeof deckReleases.$inferSelect,
  'id' | 'version' | 'studyDirection' | 'copyPolicy' | 'changeSummary' | 'createdAt'
>;
