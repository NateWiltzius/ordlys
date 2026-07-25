import { describe, expect, it } from 'vitest';
import { filterAndSortDecks } from './deck-discovery';

const decks = [
  {
    title: 'Newest',
    description: null,
    subscriberCount: 0,
    updatedAt: new Date('2026-07-20'),
  },
  {
    title: 'Most followed',
    description: null,
    subscriberCount: 3,
    updatedAt: new Date('2026-07-01'),
  },
  {
    title: 'Also followed',
    description: null,
    subscriberCount: 1,
    updatedAt: new Date('2026-07-15'),
  },
];

describe('filterAndSortDecks', () => {
  it('recommends established decks before using freshness as a tie-breaker', () => {
    expect(filterAndSortDecks(decks, '', 'recommended').map(deck => deck.title)).toEqual([
      'Most followed',
      'Also followed',
      'Newest',
    ]);
  });

  it('still filters across deck titles and descriptions', () => {
    expect(filterAndSortDecks(decks, 'new', 'recommended').map(deck => deck.title)).toEqual([
      'Newest',
    ]);
  });

  it('sorts timestamps serialized across the server-client boundary', () => {
    const serializedDecks = decks.map(deck => ({
      ...deck,
      updatedAt: deck.updatedAt.toISOString(),
    }));

    expect(filterAndSortDecks(serializedDecks, '', 'newest').map(deck => deck.title)).toEqual([
      'Newest',
      'Also followed',
      'Most followed',
    ]);
  });
});
