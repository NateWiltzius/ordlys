import UnsubscribeDeckButton from '@/app/(protected)/decks/[deckId]/_components/unsubscribe-deck-button';
import ButtonLink from '@/components/shared/button-link';
import PageHeader from '@/components/shared/layout/page-header';
import { Deck } from '@/types/deck.types';
import { Chip } from '@heroui/react';
import { STUDY_TONE_STYLES } from '@/lib/study-colors';
import MakeEditableCopyButton from '@/app/(protected)/decks/[deckId]/_components/make-editable-copy-button';

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
            {isSubscribed && !isOwned ? (
              <>
                <MakeEditableCopyButton deckId={deck.id} deckTitle={deck.title} />
                <UnsubscribeDeckButton
                  deckId={deck.id}
                  deckTitle={deck.title}
                  isArchived={Boolean(deck.deletedAt)}
                />
              </>
            ) : null}
          </div>
        ) : null
      }
    >
      {isOwned ? (
        <>
          <Chip color="warning" size="sm">
            {deck.isEditableCopy ? 'Your editable copy' : 'You own this deck'}
          </Chip>
          <Chip
            size="sm"
            variant="soft"
            color={deck.visibility === 'public' ? 'success' : 'default'}
          >
            {deck.visibility === 'public' ? 'Public' : 'Private'}
          </Chip>
        </>
      ) : deck.deletedAt ? (
        <Chip color="warning" size="sm">
          Following an archived deck
        </Chip>
      ) : isSubscribed ? (
        <Chip size="sm" className={STUDY_TONE_STYLES.learning.accent}>
          Following · updates from the author
        </Chip>
      ) : (
        <Chip size="sm">Public deck</Chip>
      )}
    </PageHeader>
  );
}
