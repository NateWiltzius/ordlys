import { DeckCard } from '@/components/deck/deck-card';
import { getPublicDecksAction, getUserSubscribedDecksAction } from '@/server/deck.actions';

export default async function PublicDecks() {
  const [decks, subscribedDecks] = await Promise.all([
    getPublicDecksAction(),
    getUserSubscribedDecksAction(),
  ]);

  const subscribedDeckIds = new Set(subscribedDecks.map(deck => deck.id));

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {decks.map(deck => (
        <DeckCard
          key={deck.id}
          deck={deck}
          tab="public"
          isSubscribed={subscribedDeckIds.has(deck.id)}
        />
      ))}
    </div>
  );
}
