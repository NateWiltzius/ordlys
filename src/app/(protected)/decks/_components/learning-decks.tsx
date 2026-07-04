import { DeckCard } from '@/app/(protected)/decks/_components/deck-card';
import { Deck } from '@/types/deck.types';

export default function LearningDecks({ decks }: { decks: Deck[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {decks.map(deck => (
        <DeckCard key={deck.id} deck={deck} tab="learning" isSubscribed={true} />
      ))}
    </div>
  );
}
