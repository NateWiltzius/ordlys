'use client';

import { DeckCard } from '@/app/(protected)/decks/_components/deck-card';
import EmptyState from '@/components/shared/empty-state';
import DeckDiscoveryControls from '@/components/deck-discovery-controls';
import type { DiscoverableDeck } from '@/db/queries/deck.queries';
import { filterAndSortDecks, type DeckDiscoverySort } from '@/lib/deck-discovery';
import { Button } from '@heroui/react';
import { useMemo, useState } from 'react';
import ButtonLink from '@/components/shared/button-link';
import CreateDeckModal from '@/app/(protected)/decks/_components/create-deck-modal';

type Props = {
  decks: DiscoverableDeck[];
  libraryDeckIds: number[];
};

export default function PublicDecks({ decks, libraryDeckIds }: Props) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<DeckDiscoverySort>('name');
  const discoverableDecks = useMemo(() => {
    const libraryIds = new Set(libraryDeckIds);
    return decks.filter(deck => !libraryIds.has(deck.id));
  }, [decks, libraryDeckIds]);
  const visibleDecks = useMemo(
    () => filterAndSortDecks(discoverableDecks, query, sort),
    [discoverableDecks, query, sort],
  );

  if (!discoverableDecks.length) {
    const everyPublicDeckIsInLibrary = decks.length > 0;

    return (
      <EmptyState
        variant="flat"
        title={
          everyPublicDeckIsInLibrary
            ? 'You’ve already added every available public deck'
            : 'No public decks are available yet'
        }
        description={
          everyPublicDeckIsInLibrary
            ? 'Continue learning from your library or create a deck of your own.'
            : 'Create a deck of your own, or check back when more public decks are available.'
        }
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <ButtonLink href="/decks">View library</ButtonLink>
            <CreateDeckModal triggerLabel="Create a deck" />
          </div>
        }
      />
    );
  }
  return (
    <div className="space-y-4">
      <DeckDiscoveryControls
        idPrefix="discover-decks"
        query={query}
        sort={sort}
        visibleCount={visibleDecks.length}
        totalCount={discoverableDecks.length}
        onQueryChange={setQuery}
        onSortChange={setSort}
      />

      {visibleDecks.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleDecks.map(deck => (
            <DeckCard
              key={deck.id}
              deck={deck}
              context="discover"
              relationship="discover"
              subscriberCount={deck.subscriberCount}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No decks match your search"
          description="Try another name or clear the search to browse every public deck."
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
