import { DeckCard } from '@/app/(protected)/decks/_components/deck-card';
import { Deck } from '@/types/deck.types';
import EmptyState from '@/components/shared/empty-state';
import CreateDeckModal from './create-deck-modal';

type Props = {
  decks: Deck[];
  learningDecks: Deck[];
};

export default function OwnedDecks({ decks, learningDecks }: Props) {
  if (!decks.length) {
    return (
      <EmptyState
        title="No decks yet"
        description="Create your first deck to begin."
        action={<CreateDeckModal />}
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
          tab="owned"
          isSubscribed={learningDeckIds.has(deck.id)}
        />
      ))}
    </div>
  );
}
