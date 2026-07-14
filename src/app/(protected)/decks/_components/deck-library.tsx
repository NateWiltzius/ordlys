'use client';

import { DeckCard } from '@/app/(protected)/decks/_components/deck-card';
import CreateDeckModal from '@/app/(protected)/decks/_components/create-deck-modal';
import DeckDiscoveryControls from '@/components/deck-discovery-controls';
import EmptyState from '@/components/shared/empty-state';
import type { LibraryDeck } from '@/db/queries/deck.queries';
import { filterAndSortDecks, type DeckDiscoverySort } from '@/lib/deck-discovery';
import { buildDeckLibrary } from '@/lib/deck-library';
import { Button } from '@heroui/react';
import { useMemo, useState } from 'react';

type Props = {
  ownedDecks: LibraryDeck[];
  followedDecks: LibraryDeck[];
  restorableDecks: LibraryDeck[];
};

export default function DeckLibrary({ ownedDecks, followedDecks, restorableDecks }: Props) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<DeckDiscoverySort>('name');
  const libraryDecks = useMemo(
    () => buildDeckLibrary(ownedDecks, followedDecks, restorableDecks),
    [followedDecks, ownedDecks, restorableDecks],
  );
  const visibleDecks = useMemo(
    () => filterAndSortDecks(libraryDecks, query, sort),
    [libraryDecks, query, sort],
  );

  if (!libraryDecks.length) {
    return (
      <EmptyState
        title="Your library is empty"
        description="Create your own deck, follow a public deck, or make an editable copy."
        action={<CreateDeckModal />}
      />
    );
  }

  return (
    <div className="space-y-4">
      <DeckDiscoveryControls
        idPrefix="library-decks"
        query={query}
        sort={sort}
        visibleCount={visibleDecks.length}
        totalCount={libraryDecks.length}
        onQueryChange={setQuery}
        onSortChange={setSort}
      />

      {visibleDecks.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleDecks.map(deck => (
            <DeckCard
              key={deck.id}
              deck={deck}
              relationship={deck.relationship}
              isFollowing={deck.isFollowing}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No decks match your search"
          description="Try another name or clear the search to browse every deck in your library."
          action={
            <Button variant="secondary" onPress={() => setQuery('')}>
              Clear search
            </Button>
          }
        />
      )}
    </div>
  );
}
