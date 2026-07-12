'use client';

import PublicDeckCard from '@/components/public-deck-card';
import DeckDiscoveryControls from '@/components/deck-discovery-controls';
import EmptyState from '@/components/shared/empty-state';
import type { PublicDeckSummary } from '@/db/queries/public-deck.queries';
import { filterAndSortDecks, type DeckDiscoverySort } from '@/lib/deck-discovery';
import { Button } from '@heroui/react';
import { useMemo, useState } from 'react';

type Props = {
  decks: PublicDeckSummary[];
};

export default function PublicDeckBrowser({ decks }: Props) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<DeckDiscoverySort>('popular');
  const visibleDecks = useMemo(() => filterAndSortDecks(decks, query, sort), [decks, query, sort]);

  return (
    <div className="space-y-4">
      <DeckDiscoveryControls
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
            <PublicDeckCard key={deck.id} deck={deck} />
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
