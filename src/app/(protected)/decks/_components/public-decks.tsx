import { DeckCard } from '@/app/(protected)/decks/_components/deck-card';
import { Deck } from '@/types/deck.types';
import EmptyState from '@/components/shared/empty-state';

type Props = {
  decks: Deck[];
  learningDecks: Deck[];
};

export default function PublicDecks({ decks, learningDecks }: Props) {
  if (!decks.length) {
    return (
      <EmptyState
        title="Nothing to discover yet"
        description="Public decks from other learners will appear here."
      />
    );
  }
  const learningDeckIds = new Set(learningDecks.map(deck => deck.id));

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {decks.map(deck => (
        <DeckCard
          key={deck.id}
          deck={deck}
          tab="public"
          isSubscribed={learningDeckIds.has(deck.id)}
        />
      ))}
    </div>
  );
}
