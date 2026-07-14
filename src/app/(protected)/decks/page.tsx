import CreateDeckModal from '@/app/(protected)/decks/_components/create-deck-modal';
import DeckLibrary from '@/app/(protected)/decks/_components/deck-library';
import PublicDecks from '@/app/(protected)/decks/_components/public-decks';
import PageHeader from '@/components/shared/layout/page-header';
import { Tabs } from '@heroui/react';
import { getDecksPageDataAction } from '@/server/deck.actions';
import ImportDeckModal from '@/app/(protected)/decks/_components/import-deck-modal';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import DecksLoading from '@/app/(protected)/decks/loading';

export const metadata: Metadata = {
  title: 'Decks',
  description: 'Manage your vocabulary decks and discover public decks.',
};

export default function DeckPage() {
  return (
    <Suspense fallback={<DecksLoading />}>
      <DecksContent />
    </Suspense>
  );
}

async function DecksContent() {
  const { ownedDecks, publicDecks, learningDecks, restorableDecks } =
    await getDecksPageDataAction();
  const libraryDeckIds = [...new Set([...ownedDecks, ...learningDecks].map(deck => deck.id))];

  return (
    <>
      <PageHeader
        title="Decks"
        description="Your library shows decks you own, copied, or follow. Discover public decks to follow or copy."
        actions={
          <div className="flex gap-2">
            <ImportDeckModal />
            <CreateDeckModal />
          </div>
        }
      />
      <Tabs className="w-full">
        <Tabs.ListContainer className="w-full">
          <Tabs.List aria-label="Deck categories" className="grid w-full grid-cols-2">
            <Tabs.Tab id="library" className="w-full justify-center">
              My library
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="public" className="w-full justify-center">
              Discover
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
        <Tabs.Panel className="pt-4" id="library">
          <DeckLibrary
            ownedDecks={ownedDecks}
            followedDecks={learningDecks}
            restorableDecks={restorableDecks}
          />
        </Tabs.Panel>
        <Tabs.Panel className="pt-4" id="public">
          <PublicDecks decks={publicDecks} libraryDeckIds={libraryDeckIds} />
        </Tabs.Panel>
      </Tabs>
    </>
  );
}
