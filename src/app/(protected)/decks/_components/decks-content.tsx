import DeckLibrary from '@/app/(protected)/decks/_components/deck-library';
import { getLibraryPageDataAction } from '@/server/deck.actions';

export default async function DecksContent() {
  const { ownedDecks, learningDecks, restorableDecks, deckStats } =
    await getLibraryPageDataAction();

  return (
    <DeckLibrary
      ownedDecks={ownedDecks}
      followedDecks={learningDecks}
      restorableDecks={restorableDecks}
      deckStats={deckStats}
    />
  );
}
