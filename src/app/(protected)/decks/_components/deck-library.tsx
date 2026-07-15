'use client';

import { DeckCard } from '@/app/(protected)/decks/_components/deck-card';
import CreateDeckModal from '@/app/(protected)/decks/_components/create-deck-modal';
import DeckDiscoveryControls from '@/components/deck-discovery-controls';
import EmptyState from '@/components/shared/empty-state';
import type { LibraryDeck } from '@/db/queries/deck.queries';
import { filterAndSortDecks, type DeckDiscoverySort } from '@/lib/deck-discovery';
import { buildDeckLibrary, type DeckLibraryItem } from '@/lib/deck-library';
import { Button, Tabs } from '@heroui/react';
import { type ReactNode, useMemo, useState } from 'react';
import ButtonLink from '@/components/shared/button-link';

type Props = {
  ownedDecks: LibraryDeck[];
  followedDecks: LibraryDeck[];
  restorableDecks: LibraryDeck[];
};

export default function DeckLibrary({ ownedDecks, followedDecks, restorableDecks }: Props) {
  const libraryDecks = useMemo(
    () => buildDeckLibrary(ownedDecks, followedDecks, restorableDecks),
    [followedDecks, ownedDecks, restorableDecks],
  );
  const learningDecks = libraryDecks.filter(deck => deck.isFollowing);
  const createdDecks = libraryDecks.filter(deck => deck.relationship !== 'following');

  if (!libraryDecks.length) {
    return (
      <EmptyState
        title="Your library is empty"
        description="Create your own deck or discover a public deck to start learning."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <ButtonLink href="/discover" variant="secondary">
              Discover decks
            </ButtonLink>
            <CreateDeckModal />
          </div>
        }
      />
    );
  }

  return (
    <Tabs className="w-full" defaultSelectedKey={learningDecks.length ? 'learning' : 'created'}>
      <Tabs.ListContainer className="w-full">
        <Tabs.List aria-label="Library sections" className="grid w-full grid-cols-2">
          <Tabs.Tab id="learning" className="w-full justify-center">
            Learning ({learningDecks.length})
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="created" className="w-full justify-center">
            Your decks ({createdDecks.length})
            <Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
      <Tabs.Panel className="pt-4" id="learning">
        <LibraryDeckCollection
          idPrefix="learning-decks"
          decks={learningDecks}
          emptyTitle="No decks in learning"
          emptyDescription="Discover a public deck or follow one of your own published decks."
          emptyAction={<ButtonLink href="/discover">Discover decks</ButtonLink>}
        />
      </Tabs.Panel>
      <Tabs.Panel className="pt-4" id="created">
        <LibraryDeckCollection
          idPrefix="created-decks"
          decks={createdDecks}
          emptyTitle="No decks of your own yet"
          emptyDescription="Create or import a deck, or copy a public deck to edit independently."
          emptyAction={
            <div className="flex flex-wrap justify-center gap-2">
              <ButtonLink href="/discover" variant="secondary">
                Discover decks
              </ButtonLink>
              <CreateDeckModal />
            </div>
          }
        />
      </Tabs.Panel>
    </Tabs>
  );
}

type CollectionProps = {
  idPrefix: string;
  decks: DeckLibraryItem<LibraryDeck>[];
  emptyTitle: string;
  emptyDescription: string;
  emptyAction: ReactNode;
};

function LibraryDeckCollection({
  idPrefix,
  decks,
  emptyTitle,
  emptyDescription,
  emptyAction,
}: CollectionProps) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<DeckDiscoverySort>('name');
  const visibleDecks = useMemo(() => filterAndSortDecks(decks, query, sort), [decks, query, sort]);

  if (!decks.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }

  return (
    <div className="space-y-4">
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
