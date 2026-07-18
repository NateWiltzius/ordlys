'use client';

import { DeckCard } from '@/app/(protected)/decks/_components/deck-card';
import DeckDiscoveryControls from '@/components/deck-discovery-controls';
import EmptyState from '@/components/shared/empty-state';
import type { LibraryDeck } from '@/db/queries/deck.queries';
import { filterAndSortDecks, type DeckDiscoverySort } from '@/lib/deck-discovery';
import type { DeckLibraryItem } from '@/lib/deck-library';
import { Button } from '@heroui/react';
import { type ReactNode, useMemo, useState } from 'react';

type Props = {
  idPrefix: string;
  heading: string;
  decks: DeckLibraryItem<LibraryDeck>[];
  emptyTitle: string;
  emptyDescription: string;
  emptyAction: ReactNode;
};

export default function LibraryDeckCollection({
  idPrefix,
  heading,
  decks,
  emptyTitle,
  emptyDescription,
  emptyAction,
}: Props) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<DeckDiscoverySort>('name');
  const visibleDecks = useMemo(() => filterAndSortDecks(decks, query, sort), [decks, query, sort]);

  if (!decks.length) {
    return (
      <div>
        <h2 className="sr-only">{heading}</h2>
        <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="sr-only">{heading}</h2>
      <DeckDiscoveryControls
        idPrefix={idPrefix}
        query={query}
        sort={sort}
        visibleCount={visibleDecks.length}
        totalCount={decks.length}
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
          description="Try another name or clear the search to browse this section."
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
