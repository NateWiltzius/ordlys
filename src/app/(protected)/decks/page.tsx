import CreateDeckModal from '@/app/(protected)/decks/_components/create-deck-modal';
import LearningDecks from '@/app/(protected)/decks/_components/learning-decks';
import OwnedDecks from '@/app/(protected)/decks/_components/owned-decks';
import PublicDecks from '@/app/(protected)/decks/_components/public-decks';
import PageHeader from '@/components/shared/layout/page-header';
import { getDecksPageDataAction } from '@/server/deck.actions';
import { Tabs } from '@heroui/react';

export default async function DeckPage() {
  const { ownedDecks, publicDecks, learningDecks } = await getDecksPageDataAction();

  return (
    <>
      <PageHeader
        title="Decks"
        description="Create decks, start learning, or discover public content."
        actions={<CreateDeckModal />}
      />
      <Tabs className="w-full">
        <Tabs.ListContainer className="max-w-full overflow-x-auto">
          <Tabs.List aria-label="Deck categories" className="min-w-max">
            <Tabs.Tab id="learning">
              Learning
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="owned">
              My decks
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="public">
              Discover
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
        <Tabs.Panel className="pt-4" id="learning">
          <LearningDecks decks={learningDecks} />
        </Tabs.Panel>
        <Tabs.Panel className="pt-4" id="owned">
          <OwnedDecks decks={ownedDecks} learningDecks={learningDecks} />
        </Tabs.Panel>
        <Tabs.Panel className="pt-4" id="public">
          <PublicDecks decks={publicDecks} learningDecks={learningDecks} />
        </Tabs.Panel>
      </Tabs>
    </>
  );
}
