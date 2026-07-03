import LearningDecks from '@/app/(protected)/decks/learning-decks';
import OwnedDecks from '@/app/(protected)/decks/owned-decks';
import PublicDecks from '@/app/(protected)/decks/public-decks';
import CreateDeckModal from '@/components/shared/create-deck-modal';
import PageHeader from '@/components/shared/layout/page-header';
import { Tabs } from '@heroui/react';

export default function DeckPage() {
  return (
    <>
      <PageHeader
        title="Decks"
        description="Create decks, start learning, or discover public content."
        actions={<CreateDeckModal />}
      />
      <Tabs className="w-full">
        <Tabs.ListContainer>
          <Tabs.List aria-label="Options">
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
          <LearningDecks />
        </Tabs.Panel>
        <Tabs.Panel className="pt-4" id="owned">
          <OwnedDecks />
        </Tabs.Panel>
        <Tabs.Panel className="pt-4" id="public">
          <PublicDecks />
        </Tabs.Panel>
      </Tabs>
    </>
  );
}
