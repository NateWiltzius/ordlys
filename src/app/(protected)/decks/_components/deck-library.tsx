'use client';

import CreateDeckModal from '@/app/(protected)/decks/_components/create-deck-modal';
import LibraryDeckCollection from '@/app/(protected)/decks/_components/library-deck-collection';
import EmptyState from '@/components/shared/empty-state';
import type { LibraryDeck } from '@/db/queries/deck.queries';
import { buildDeckLibrary } from '@/lib/deck-library';
import { Tabs } from '@heroui/react';
import { useMemo } from 'react';
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
          context="learning"
          heading="Learning decks"
          decks={learningDecks}
          emptyTitle="No decks in learning"
          emptyDescription="Discover a public deck or follow one of your own published decks."
          emptyAction={<ButtonLink href="/discover">Discover decks</ButtonLink>}
        />
      </Tabs.Panel>
      <Tabs.Panel className="pt-4" id="created">
        <LibraryDeckCollection
          idPrefix="created-decks"
          context="created"
          heading="Your decks"
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
