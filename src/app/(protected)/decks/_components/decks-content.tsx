import CreateDeckModal from '@/app/(protected)/decks/_components/create-deck-modal';
import DeckLibrary from '@/app/(protected)/decks/_components/deck-library';
import ImportDeckModal from '@/app/(protected)/decks/_components/import-deck-modal';
import PageHeader from '@/components/shared/layout/page-header';
import { getLibraryPageDataAction } from '@/server/deck.actions';

export default async function DecksContent() {
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
