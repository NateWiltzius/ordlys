import CreateDeckModal from '@/app/(protected)/decks/_components/create-deck-modal';
import DeckLibrary from '@/app/(protected)/decks/_components/deck-library';
import PublicDecks from '@/app/(protected)/decks/_components/public-decks';
import PageHeader from '@/components/shared/layout/page-header';
import { Tabs } from '@heroui/react';
import { getDecksPageDataAction } from '@/server/deck.actions';

export default async function DeckPage() {
  const { ownedDecks, publicDecks, learningDecks } = await getDecksPageDataAction();
  const libraryDeckIds = [...new Set([...ownedDecks, ...learningDecks].map(deck => deck.id))];

  return (
    <>
      <PageHeader
        title="Decks"
        description="Your library shows decks you own, copied, or follow. Discover public decks to follow or copy."
        actions={<CreateDeckModal />}
      />
      <Tabs className="w-full">
        <Tabs.ListContainer className="max-w-full overflow-x-auto">
          <Tabs.List aria-label="Deck categories" className="min-w-max">
            <Tabs.Tab id="library">
              My library
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="public">
              Discover
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
        <Tabs.Panel className="pt-4" id="library">
          <DeckLibrary ownedDecks={ownedDecks} followedDecks={learningDecks} />
        </Tabs.Panel>
        <Tabs.Panel className="pt-4" id="public">
          <PublicDecks decks={publicDecks} libraryDeckIds={libraryDeckIds} />
        </Tabs.Panel>
      </Tabs>
    </>
  );
}
