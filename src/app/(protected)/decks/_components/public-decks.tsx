import { DeckCard } from '@/app/(protected)/decks/_components/deck-card';
import { Deck } from '@/types/deck.types';
import EmptyState from '@/components/shared/empty-state';

type Props = {
  decks: Deck[];
  libraryDeckIds: number[];
};

export default function PublicDecks({ decks, libraryDeckIds }: Props) {
  const libraryIds = new Set(libraryDeckIds);
  const discoverableDecks = decks.filter(deck => !libraryIds.has(deck.id));

  if (!discoverableDecks.length) {
    return (
      <EmptyState
        title="Nothing to discover yet"
        description="Public decks from other learners will appear here."
      />
    );
  }
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {discoverableDecks.map(deck => (
        <DeckCard key={deck.id} deck={deck} relationship="discover" />
      ))}
    </div>
  );
}
