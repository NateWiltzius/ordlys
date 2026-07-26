import DeckLibrary from '@/app/(protected)/decks/_components/deck-library';
import { getLibraryPageData } from '@/server/data/deck-page-data';

export default async function DecksContent() {
  const { ownedDecks, learningDecks, restorableDecks, deckStats } = await getLibraryPageData();

  return (
    <DeckLibrary
      ownedDecks={ownedDecks}
      followedDecks={learningDecks}
      restorableDecks={restorableDecks}
      deckStats={deckStats}
    />
  );
}
