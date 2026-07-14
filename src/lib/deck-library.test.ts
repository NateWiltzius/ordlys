import { describe, expect, it } from 'vitest';
import { buildDeckLibrary } from './deck-library';

type TestDeck = {
  id: number;
  sourceReleaseId: number | null;
  title: string;
};

const deck = (id: number, sourceReleaseId: number | null = null): TestDeck => ({
  id,
  sourceReleaseId,
  title: `Deck ${id}`,
});

describe('deck library', () => {
  it('merges an owned follow into the owned card', () => {
    const ownedDeck = deck(1);

    expect(buildDeckLibrary([ownedDeck], [ownedDeck], [])).toEqual([
      { ...ownedDeck, relationship: 'owned', isFollowing: true },
    ]);
  });

  it('shows a restorable deck only once when its follow is frozen', () => {
    const restorableDeck = deck(51);

    expect(buildDeckLibrary([], [restorableDeck], [restorableDeck])).toEqual([
      { ...restorableDeck, relationship: 'restorable', isFollowing: false },
    ]);
  });

  it('keeps unrelated followed decks in the library', () => {
    const followedDeck = deck(2);

    expect(buildDeckLibrary([], [followedDeck], [])).toEqual([
      { ...followedDeck, relationship: 'following', isFollowing: true },
    ]);
  });
});
