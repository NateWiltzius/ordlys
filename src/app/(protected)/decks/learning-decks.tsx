import { DeckCard } from '@/components/deck/deck-card';
import { getUserSubscribedDecksAction } from '@/server/deck.actions';

export default async function LearningDecks() {
  const decks = await getUserSubscribedDecksAction();

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {decks.map(deck => (
        <DeckCard key={deck.id} deck={deck} tab="learning" isSubscribed={true} />
      ))}
    </div>
  );
}
