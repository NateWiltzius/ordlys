import { deckReleases } from '@/db/schema';

/**
 * Release fields safe to pass through server components to the browser.
 * Creator identifiers and internal content hashes deliberately stay server-only.
 */
export const safeDeckReleaseSelection = {
  id: deckReleases.id,
  version: deckReleases.version,
  studyDirection: deckReleases.studyDirection,
  copyPolicy: deckReleases.copyPolicy,
  changeSummary: deckReleases.changeSummary,
  createdAt: deckReleases.createdAt,
};
