import { describe, expect, it } from 'vitest';
import { DECK_LIMITS } from '../config/deck-limits';
import { assertAuthoringCapacity, type AuthoringUsage } from './authoring-quota';

const emptyUsage: AuthoringUsage = {
  activeDecks: 0,
  publicDecks: 0,
  deckCards: 0,
  logicalVocabs: 0,
  revisionsToday: 0,
};

describe('authoring capacity policy', () => {
  it('allows a request that reaches each limit exactly', () => {
    expect(() =>
      assertAuthoringCapacity(emptyUsage, {
        activeDecks: DECK_LIMITS.activeOwnedDecks,
        publicDecks: DECK_LIMITS.publicCatalogDecks,
        deckCards: DECK_LIMITS.cardsPerDeck,
        logicalVocabs: DECK_LIMITS.logicalVocabsPerAccount,
        revisionsToday: DECK_LIMITS.revisionsPerDay,
      }),
    ).not.toThrow();
  });

  it.each([
    ['activeDecks', DECK_LIMITS.activeOwnedDecks, 'DECK_QUOTA'],
    ['publicDecks', DECK_LIMITS.publicCatalogDecks, 'PUBLIC_DECK_QUOTA'],
    ['deckCards', DECK_LIMITS.cardsPerDeck, 'CARD_QUOTA'],
    ['logicalVocabs', DECK_LIMITS.logicalVocabsPerAccount, 'VOCAB_QUOTA'],
    ['revisionsToday', DECK_LIMITS.revisionsPerDay, 'REVISION_RATE_LIMIT'],
  ] as const)('rejects %s additions beyond the limit', (key, current, code) => {
    try {
      assertAuthoringCapacity({ ...emptyUsage, [key]: current }, { [key]: 1 });
      throw new Error('Expected the quota check to fail.');
    } catch (error) {
      expect(error).toMatchObject({ code });
    }
  });

  it('supports workflow-specific user-facing messages', () => {
    expect(() =>
      assertAuthoringCapacity(
        { ...emptyUsage, deckCards: DECK_LIMITS.cardsPerDeck },
        { deckCards: 1 },
        { deckCards: { message: 'Import exceeds the deck card limit.' } },
      ),
    ).toThrow('Import exceeds the deck card limit.');
  });
});
