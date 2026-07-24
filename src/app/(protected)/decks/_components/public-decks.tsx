'use client';

import CreateDeckModal from '@/app/(protected)/decks/_components/create-deck-modal';
import { DeckCard } from '@/app/(protected)/decks/_components/deck-card';
import ButtonLink from '@/components/shared/button-link';
import DeckDiscoveryControls from '@/components/deck-discovery-controls';
import EmptyState from '@/components/shared/empty-state';
import type { DiscoverableDeck } from '@/db/queries/deck.queries';
import { filterAndSortDecks, type DeckDiscoverySort } from '@/lib/deck-discovery';
import { Button } from '@heroui/react';
import { useMemo, useState } from 'react';

type Props = {
  decks: DiscoverableDeck[];
  ownedDeckIds: number[];
  followingDeckIds: number[];
};

export default function PublicDecks({ decks, ownedDeckIds, followingDeckIds }: Props) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<DeckDiscoverySort>('name');
  const ownedIds = useMemo(() => new Set(ownedDeckIds), [ownedDeckIds]);
  const followingIds = useMemo(() => new Set(followingDeckIds), [followingDeckIds]);
  const visibleDecks = useMemo(() => filterAndSortDecks(decks, query, sort), [decks, query, sort]);

  if (!decks.length) {
    return (
      <EmptyState
        variant="flat"
        title="No public decks are available yet"
        description="Create a deck of your own, or check back when more public decks are available."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <ButtonLink href="/decks" variant="secondary">
              View library
            </ButtonLink>
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
        totalCount={decks.length}
        onQueryChange={setQuery}
        onSortChange={setSort}
      />

      {visibleDecks.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleDecks.map(deck => {
            const isOwned = ownedIds.has(deck.id);
            const isFollowing = followingIds.has(deck.id);

            return (
              <DeckCard
                key={deck.id}
                deck={deck}
                context="discover"
                relationship={isOwned ? 'owned' : isFollowing ? 'following' : 'discover'}
                isFollowing={isFollowing}
                subscriberCount={deck.subscriberCount}
                lessonCount={deck.lessonCount}
                wordCount={deck.wordCount}
              />
            );
          })}
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
