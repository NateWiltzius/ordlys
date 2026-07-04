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
      description={
        isOwned
          ? 'You manage this deck and can edit its lessons and vocabulary.'
          : deck.deletedAt
            ? 'The owner removed this deck, but your subscription and progress are preserved.'
            : isSubscribed
              ? 'You are currently learning this deck. Review due cards and keep going.'
              : 'This is a public deck. Start learning it to add it to your active study list.'
      }
      actions={
        isOwned ? (
          <ButtonLink href={`/decks/${deck.id}/edit`} variant="secondary">
            Edit deck
          </ButtonLink>
        ) : isSubscribed ? (
          <UnsubscribeDeckButton deckId={deck.id} />
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
