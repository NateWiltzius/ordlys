import { DeckCard } from '@/app/(protected)/decks/_components/deck-card';
import { Deck } from '@/types/deck.types';

type Props = {
  decks: Deck[];
  subscribedDecks: Deck[];
};

export default function OwnedDecks({ decks, subscribedDecks }: Props) {
  const subscribedDeckIds = new Set(subscribedDecks.map(deck => deck.id));

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {decks.map(deck => (
        <DeckCard
          key={deck.id}
          deck={deck}
          tab="owned"
          isSubscribed={subscribedDeckIds.has(deck.id)}
        />
      ))}
    </div>
  );
}
