import { DeckCard } from '@/app/(protected)/decks/_components/deck-card';
import CreateDeckModal from '@/app/(protected)/decks/_components/create-deck-modal';
import EmptyState from '@/components/shared/empty-state';
import { Deck } from '@/types/deck.types';

type Props = {
  ownedDecks: Deck[];
  followedDecks: Deck[];
};

export default function DeckLibrary({ ownedDecks, followedDecks }: Props) {
  const followedDeckIds = new Set(followedDecks.map(deck => deck.id));
  const ownedDeckIds = new Set(ownedDecks.map(deck => deck.id));
  const followedOnlyDecks = followedDecks.filter(deck => !ownedDeckIds.has(deck.id));

  if (ownedDecks.length === 0 && followedOnlyDecks.length === 0) {
    return (
      <EmptyState
        title="Your library is empty"
        description="Create your own deck, follow a public deck, or make an editable copy."
        action={<CreateDeckModal />}
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {ownedDecks.map(deck => (
        <DeckCard
          key={deck.id}
          deck={deck}
          relationship={deck.isEditableCopy ? 'copy' : 'owned'}
          isSubscribed={followedDeckIds.has(deck.id)}
        />
      ))}
      {followedOnlyDecks.map(deck => (
        <DeckCard key={deck.id} deck={deck} relationship="following" isSubscribed />
      ))}
    </div>
  );
}
