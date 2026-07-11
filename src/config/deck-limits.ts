function positiveLimit(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isSafeInteger(value) && value > 0 ? value : fallback;
}

export const DECK_LIMITS = Object.freeze({
  activeOwnedDecks: positiveLimit('DECK_LIMIT_ACTIVE_OWNED', 100),
  publicCatalogDecks: positiveLimit('DECK_LIMIT_PUBLIC_CATALOG', 20),
  logicalVocabsPerAccount: positiveLimit('DECK_LIMIT_ACCOUNT_VOCABS', 50_000),
  cardsPerDeck: positiveLimit('DECK_LIMIT_CARDS', 10_000),
  forksPerHour: positiveLimit('DECK_LIMIT_FORKS_HOUR', 20),
  forksPerDay: positiveLimit('DECK_LIMIT_FORKS_DAY', 100),
  publicationsPerDay: positiveLimit('DECK_LIMIT_PUBLICATIONS_DAY', 50),
  revisionsPerDay: positiveLimit('DECK_LIMIT_REVISIONS_DAY', 5_000),
  maximumReleaseCards: positiveLimit('DECK_LIMIT_RELEASE_CARDS', 10_000),
});
