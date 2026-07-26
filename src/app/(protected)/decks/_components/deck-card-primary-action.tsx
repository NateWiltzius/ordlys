import ButtonLink from '@/components/shared/button-link';
import { STUDY_TONE_STYLES } from '@/lib/study-colors';
import type { DeckRowPrimaryAction } from '@/lib/deck-card-actions';
import type { ReviewCounts } from '@/types/review.types';
import { Button } from '@heroui/react';

export default function DeckCardPrimaryAction({
  action,
  deckId,
  deckTitle,
  layout,
  stats,
  pending,
  onFollow,
  onRestore,
}: {
  action: DeckRowPrimaryAction;
  deckId: number;
  deckTitle: string;
  layout: 'card' | 'row';
  stats: ReviewCounts;
  pending: string | null;
  onFollow: () => void;
  onRestore: () => void;
}) {
  const className = layout === 'row' ? 'w-full sm:w-auto' : 'flex-1';

  if (action === 'restore') {
    return (
      <Button size="sm" className={className} isPending={pending === 'restore'} onPress={onRestore}>
        Restore deck <span className="sr-only">{deckTitle}</span>
      </Button>
    );
  }
  if (action === 'review') {
    return (
      <ButtonLink
        href={`/decks/${deckId}/review`}
        size="sm"
        className={`${className} ${STUDY_TONE_STYLES.review.button}`}
      >
        {layout === 'row' ? 'Review' : 'Review deck'}{' '}
        <span className="sr-only">in {deckTitle}</span>
      </ButtonLink>
    );
  }
  if (action === 'learn') {
    return (
      <ButtonLink
        href={`/decks/${deckId}/learn`}
        size="sm"
        className={`${className} ${STUDY_TONE_STYLES.learning.button}`}
      >
        {layout === 'row' ? 'Learn' : `Learn ${stats.newWordsAvailable}`}
        <span className="sr-only"> in {deckTitle}</span>
      </ButtonLink>
    );
  }
  if (action === 'open') {
    return (
      <ButtonLink href={`/decks/${deckId}`} size="sm" variant="secondary" className={className}>
        Open deck <span className="sr-only">{deckTitle}</span>
      </ButtonLink>
    );
  }
  if (action === 'manage') {
    return (
      <ButtonLink
        href={`/decks/${deckId}/edit`}
        size="sm"
        variant="secondary"
        className={className}
      >
        Manage deck <span className="sr-only">{deckTitle}</span>
      </ButtonLink>
    );
  }
  return (
    <Button
      size="sm"
      className={`${className} ${STUDY_TONE_STYLES.learning.button}`}
      isPending={pending === 'follow'}
      onPress={onFollow}
    >
      Follow deck <span className="sr-only">{deckTitle}</span>
    </Button>
  );
}
