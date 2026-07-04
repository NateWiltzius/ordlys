import { DeckCard } from '@/app/(protected)/decks/_components/deck-card';
import { Deck } from '@/types/deck.types';
import EmptyState from '@/components/shared/empty-state';

export default function LearningDecks({ decks }: { decks: Deck[] }) {
  if (!decks.length) {
    return (
      <EmptyState
        title="No active decks"
        description="Subscribe to a public deck to start learning."
      />
    );
  }
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {decks.map(deck => (
        <DeckCard key={deck.id} deck={deck} tab="learning" isSubscribed={true} />
      ))}
    </div>
  );
}
