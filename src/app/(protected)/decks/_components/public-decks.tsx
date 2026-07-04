import { DeckCard } from '@/app/(protected)/decks/_components/deck-card';
import { Deck } from '@/types/deck.types';

type Props = {
  decks: Deck[];
  subscribedDecks: Deck[];
};

export default function PublicDecks({ decks, subscribedDecks }: Props) {
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
