'use client';

import { type DeckBadgeKind } from '@/components/shared/deck-badge';
import {
  getDeckCardActionPlan,
  getDeckRowPrimaryAction,
  type DeckCardContext,
  type DeckCardRelationship,
} from '@/lib/deck-card-actions';
import { formatLanguagePair } from '@/lib/languages';
import type { Deck } from '@/types/deck.types';
import type { ReviewCounts } from '@/types/review.types';
import { useMountedTimestamp } from '@/hooks/use-mounted-timestamp';
import { useDeckCardActions } from './use-deck-card-actions';
import { DeckCardConfirmationDialog, DeckCardMenu } from './deck-card-controls';
import { DeckCardRowView, DeckCardTileView } from './deck-card-layouts';
import DeckCardPrimaryAction from './deck-card-primary-action';

type Props = {
  deck: Deck;
  context: DeckCardContext;
  relationship: DeckCardRelationship;
  isFollowing?: boolean;
  subscriberCount?: number;
  lessonCount?: number;
  wordCount?: number;
  layout?: 'card' | 'row';
  stats?: Pick<ReviewCounts, 'totalWords' | 'newWordsAvailable' | 'reviewsDue' | 'wordsInReview'>;
};

export function DeckCard({
  deck,
  context,
  relationship,
  isFollowing = false,
  subscriberCount,
  lessonCount,
  wordCount,
  layout = 'card',
  stats,
}: Props) {
  const mountedAt = useMountedTimestamp();
  const actions = useDeckCardActions(deck);
  const actionPlan = getDeckCardActionPlan({
    context,
    relationship,
    isFollowing,
    hasPublishedRelease: deck.currentReleaseId !== null,
    allowsCopying: deck.copyPolicy !== 'follow_only',
  });
  const studyStats: ReviewCounts = stats ?? {
    totalWords: 0,
    newWordsAvailable: 0,
    reviewsDue: 0,
    wordsInReview: 0,
  };
  const rowPrimaryAction = getDeckRowPrimaryAction(actionPlan.primary, context, studyStats);
  const badges = getRelationshipBadges(deck, relationship, isFollowing);
  const activityMetadata = [
    studyStats.totalWords === 0 && deck.currentReleaseId ? 'No cards' : null,
    context === 'created' && subscriberCount && subscriberCount > 0
      ? `${subscriberCount} ${subscriberCount === 1 ? 'follower' : 'followers'}`
      : null,
  ].filter((item): item is string => Boolean(item));

  const primaryAction = (
    <DeckCardPrimaryAction
      action={rowPrimaryAction}
      deckId={deck.id}
      deckTitle={deck.title}
      layout={layout}
      stats={studyStats}
      pending={actions.pending}
      onFollow={actions.follow}
      onRestore={actions.restore}
    />
  );
  const menuAction = (
    <DeckCardMenu
      deckTitle={deck.title}
      actions={actionPlan.menu}
      pending={actions.pending !== null}
      isOpen={actions.isMenuOpen}
      onOpenChange={actions.setIsMenuOpen}
      onAction={actions.handleMenuAction}
    />
  );
  const confirmationDialog = (
    <DeckCardConfirmationDialog
      deckTitle={deck.title}
      confirmation={actions.confirmation}
      pending={actions.pending !== null}
      onClose={() => actions.setConfirmation(null)}
      onConfirm={actions.handleConfirmation}
    />
  );
  const viewProps = {
    deck,
    relationship,
    badges,
    languagePair: formatLanguagePair(deck.frontLanguage, deck.backLanguage),
    stats: studyStats,
    introducedCards: Math.min(studyStats.wordsInReview, studyStats.totalWords),
    activityMetadata,
    mutationError: actions.mutationError,
    retentionMessage: getRetentionMessage(deck.retentionUntil, mountedAt),
    primaryAction,
    menuAction,
    confirmationDialog,
    subscriberCount,
    lessonCount,
    wordCount,
  };

  return layout === 'row' ? (
    <DeckCardRowView {...viewProps} />
  ) : (
    <DeckCardTileView {...viewProps} />
  );
}

function getRelationshipBadges(
  deck: Deck,
  relationship: DeckCardRelationship,
  isFollowing: boolean,
): DeckBadgeKind[] {
  const badges: DeckBadgeKind[] = {
    owned: ['owned'],
    copy: ['copy'],
    following: [],
    discover: [],
    restorable: ['owned', deck.status === 'deleted' ? 'deletion-pending' : 'archived'],
  }[relationship] as DeckBadgeKind[];

  if (
    isFollowing &&
    relationship !== 'owned' &&
    relationship !== 'copy' &&
    relationship !== 'restorable'
  ) {
    badges.push('following');
  }
  if (deck.status === 'active') badges.push(deck.visibility);
  return badges;
}

function getRetentionMessage(retentionUntil: Date | null, mountedAt: number | null): string {
  if (!retentionUntil) return 'Recoverable until an unknown date.';
  if (mountedAt !== null && retentionUntil.getTime() <= mountedAt) {
    return 'Ready for permanent deletion.';
  }

  const date = new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(retentionUntil);
  return `Recoverable until ${date}.`;
}
