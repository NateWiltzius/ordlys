'use client';

import { DeckCard } from '@/app/(protected)/decks/_components/deck-card';
import DeckDiscoveryControls from '@/components/deck-discovery-controls';
import EmptyState from '@/components/shared/empty-state';
import type { LibraryDeck } from '@/db/queries/deck.queries';
import { filterAndSortDecks, type DeckDiscoverySort } from '@/lib/deck-discovery';
import type { DeckLibraryItem } from '@/lib/deck-library';
import type { DeckCardContext } from '@/lib/deck-card-actions';
import { Button } from '@heroui/react';
import { type ReactNode, useMemo, useState } from 'react';
import type { ReviewCounts } from '@/types/review.types';

type Props = {
  idPrefix: string;
  context: Extract<DeckCardContext, 'learning' | 'created'>;
  heading: string;
  decks: DeckLibraryItem<LibraryDeck>[];
  deckStats: Record<number, ReviewCounts>;
  emptyTitle: string;
  emptyDescription: string;
  emptyAction: ReactNode;
};

export default function LibraryDeckCollection({
  idPrefix,
  context,
  heading,
  decks,
  deckStats,
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
    <div>
      <h2 className="sr-only">{heading}</h2>
      <DeckDiscoveryControls
        idPrefix={idPrefix}
        query={query}
        sort={sort}
        visibleCount={visibleDecks.length}
        totalCount={decks.length}
        onQueryChange={setQuery}
        onSortChange={setSort}
        compact
      />

      {visibleDecks.length ? (
        <div className="divide-y divide-default-200 border-b border-default-200">
          {visibleDecks.map(deck => (
            <DeckCard
              key={deck.id}
              deck={deck}
              context={context}
              relationship={deck.relationship}
              isFollowing={deck.isFollowing}
              subscriberCount={deck.subscriberCount}
              layout="row"
              stats={deckStats[deck.id]}
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
