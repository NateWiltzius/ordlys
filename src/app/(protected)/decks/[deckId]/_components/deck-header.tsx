import UnsubscribeDeckButton from '@/app/(protected)/decks/[deckId]/_components/unsubscribe-deck-button';
import ButtonLink from '@/components/shared/button-link';
import PageHeader from '@/components/shared/layout/page-header';
import { Deck } from '@/types/deck.types';
import { Chip } from '@heroui/react';

type Props = {
  deck: Deck;
  isOwned: boolean;
  isSubscribed: boolean;
};

export default function DeckHeader({ deck, isOwned, isSubscribed }: Props) {
  return (
    <PageHeader
      title={deck.title}
      description={deck.description || 'No description provided.'}
      actions={
        isOwned || isSubscribed ? (
          <div className="flex flex-wrap gap-2">
            {isOwned ? (
              <ButtonLink href={`/decks/${deck.id}/edit`} variant="secondary">
                Edit deck
              </ButtonLink>
            ) : null}
            {isSubscribed ? (
              <UnsubscribeDeckButton
                deckId={deck.id}
                deckTitle={deck.title}
                isArchived={Boolean(deck.deletedAt)}
              />
            ) : null}
          </div>
        ) : null
      }
    >
      {isOwned ? (
        <Chip color="warning" size="sm">
          You own this deck
        </Chip>
      ) : deck.deletedAt ? (
        <Chip color="warning" size="sm">
          Retained subscription
        </Chip>
      ) : isSubscribed ? (
        <Chip color="success" size="sm">
          You are learning this deck
        </Chip>
      ) : (
        <Chip size="sm">Public deck</Chip>
      )}
    </PageHeader>
  );
}
