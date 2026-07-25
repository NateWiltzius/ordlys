import CreateDeckModal from '@/app/(protected)/decks/_components/create-deck-modal';
import DeckLibrary from '@/app/(protected)/decks/_components/deck-library';
import ImportDeckModal from '@/app/(protected)/decks/_components/import-deck-modal';
import PageHeader from '@/components/shared/layout/page-header';
import { getLibraryPageDataAction } from '@/server/deck.actions';

type Props = {
  initialAction?: 'create' | 'import';
};

export default async function DecksContent({ initialAction }: Props) {
  const { ownedDecks, learningDecks, restorableDecks, deckStats } =
    await getLibraryPageDataAction();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Library"
        description="Open decks you are learning or manage decks you own."
        actions={
          <>
            <ImportDeckModal autoOpen={initialAction === 'import'} />
            <CreateDeckModal autoOpen={initialAction === 'create'} />
          </>
        }
      />
      <DeckLibrary
        ownedDecks={ownedDecks}
        followedDecks={learningDecks}
        restorableDecks={restorableDecks}
        deckStats={deckStats}
      />
    </div>
  );
}
