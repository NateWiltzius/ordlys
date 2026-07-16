type DeckLibrarySource = {
  id: number;
  sourceReleaseId: number | null;
};

export type DeckLibraryItem<T extends DeckLibrarySource> = T & {
  relationship: 'owned' | 'copy' | 'following' | 'restorable';
  isFollowing: boolean;
};

export function buildDeckLibrary<T extends DeckLibrarySource>(
  ownedDecks: T[],
  followedDecks: T[],
  restorableDecks: T[],
): DeckLibraryItem<T>[] {
  const followedDeckIds = new Set(followedDecks.map(deck => deck.id));
  const representedDeckIds = new Set([...ownedDecks, ...restorableDecks].map(deck => deck.id));

  return [
    ...ownedDecks.map(deck => ({
      ...deck,
      relationship: deck.sourceReleaseId ? ('copy' as const) : ('owned' as const),
      isFollowing: followedDeckIds.has(deck.id),
    })),
    ...followedDecks
      .filter(deck => !representedDeckIds.has(deck.id))
      .map(deck => ({ ...deck, relationship: 'following' as const, isFollowing: true })),
    ...restorableDecks.map(deck => ({
      ...deck,
      relationship: 'restorable' as const,
      isFollowing: followedDeckIds.has(deck.id),
    })),
  ];
}
