import CreateDeckModal from '@/app/(protected)/decks/_components/create-deck-modal';
import DeckLibrary from '@/app/(protected)/decks/_components/deck-library';
import PageHeader from '@/components/shared/layout/page-header';
import { getLibraryPageDataAction } from '@/server/deck.actions';
import ImportDeckModal from '@/app/(protected)/decks/_components/import-deck-modal';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import DecksLoading from '@/app/(protected)/decks/loading';

export const metadata: Metadata = {
  title: 'Library',
  description: 'Open decks you are learning or manage decks you own.',
};

export default function DeckPage() {
  return (
    <Suspense fallback={<DecksLoading />}>
      <DecksContent />
    </Suspense>
  );
}

async function DecksContent() {
  const { ownedDecks, learningDecks, restorableDecks } = await getLibraryPageDataAction();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Library"
        description="Open decks you are learning or manage decks you own."
        actions={
          <div className="flex gap-2">
            <ImportDeckModal />
            <CreateDeckModal />
          </div>
        }
      />
      <DeckLibrary
        ownedDecks={ownedDecks}
        followedDecks={learningDecks}
        restorableDecks={restorableDecks}
      />
    </div>
  );
}
