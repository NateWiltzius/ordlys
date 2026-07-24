'use client';

import { useEffect, useState } from 'react';
import { deleteDeckAction } from '@/server/deck.actions';
import { followDeckAction, unfollowDeckAction } from '@/server/deck-follow.actions';
import { forkReleaseAction, restoreDeckAction } from '@/server/deck-release.actions';
import { Deck } from '@/types/deck.types';
import { STUDY_TONE_STYLES } from '@/lib/study-colors';
import { Button, Card, ListBox, Popover } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { errorMessage } from '@/lib/validation/content';
import ConfirmationDialog from '@/components/shared/confirmation-dialog';
import StatusAlert from '@/components/shared/status-alert';
import { isActionFailure } from '@/lib/action-result';
import { type DeckBadgeKind } from '@/components/shared/deck-badge';
import Link from 'next/link';
import ButtonLink from '@/components/shared/button-link';
import {
  getDeckCardActionPlan,
  getDeckRowPrimaryAction,
  type DeckCardAction,
  type DeckCardContext,
  type DeckCardRelationship,
} from '@/lib/deck-card-actions';
import type { ReviewCounts } from '@/types/review.types';
import { formatLanguagePair } from '@/lib/languages';
import DeckMetadataLine from '@/components/shared/deck-metadata-line';
import DeckCoverage from '@/components/shared/deck-coverage';
import DeckIdentity from '@/components/shared/deck-identity';
import DeckWorkload from '@/components/shared/deck-workload';

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
  const router = useRouter();
  const [following, setFollowing] = useState(isFollowing);
  const [pending, setPending] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<'copy' | 'delete' | 'unfollow' | null>(null);

  useEffect(() => setFollowing(isFollowing), [isFollowing]);

  async function run(key: string, operation: () => Promise<unknown>, fallback: string) {
    if (pending) return;
    try {
      setPending(key);
      setMutationError(null);
      const result = await operation();
      if (isActionFailure(result)) {
        setMutationError(result.message);
        return;
      }
      router.refresh();
    } catch (error) {
      setMutationError(errorMessage(error, fallback));
    } finally {
      setPending(null);
    }
  }

  const handleFollow = () =>
    run(
      'follow',
      async () => {
        const result = await followDeckAction(deck.id);
        if (isActionFailure(result)) return result;
        setFollowing(true);
        return result;
      },
      'Could not follow the deck.',
    );

  const handleUnfollow = async () => {
    await run(
      'unfollow',
      async () => {
        const result = await unfollowDeckAction(deck.id);
        if (isActionFailure(result)) return result;
        setFollowing(false);
        return result;
      },
      'Could not unfollow the deck.',
    );
  };

  const handleDelete = async () => {
    await run('delete', () => deleteDeckAction(deck.id), 'Could not delete the deck.');
  };

  const handleCopy = async () => {
    if (pending) return;
    try {
      setPending('copy');
      if (!deck.currentReleaseId) throw new Error('This deck has no published release.');
      const copiedDeckId = await forkReleaseAction(deck.currentReleaseId, crypto.randomUUID());
      if (isActionFailure(copiedDeckId)) {
        setMutationError(copiedDeckId.message);
        return;
      }
      window.location.assign(`/decks/${copiedDeckId}/edit`);
    } catch (error) {
      setMutationError(errorMessage(error, 'Could not create the copy.'));
    } finally {
      setPending(null);
    }
  };

  const handleMenuAction = async (key: React.Key) => {
    setIsMenuOpen(false);
    switch (key as DeckCardAction) {
      case 'review':
        router.push(`/decks/${deck.id}/review`);
        break;
      case 'manage':
        router.push(`/decks/${deck.id}/edit`);
        break;
      case 'copy':
        setConfirmation('copy');
        break;
      case 'delete':
        setConfirmation('delete');
        break;
      case 'follow':
        await handleFollow();
        break;
      case 'unfollow':
        setConfirmation('unfollow');
        break;
    }
  };

  const actionPlan = getDeckCardActionPlan({
    context,
    relationship,
    isFollowing: following,
    hasPublishedRelease: deck.currentReleaseId !== null,
    allowsCopying: deck.copyPolicy !== 'follow_only',
  });

  const relationshipBadges: DeckBadgeKind[] = {
    owned: ['owned'],
    copy: ['copy'],
    following: [],
    discover: [],
    restorable: ['owned', deck.status === 'deleted' ? 'deletion-pending' : 'archived'],
  }[relationship] as DeckBadgeKind[];

  if (
    following &&
    relationship !== 'owned' &&
    relationship !== 'copy' &&
    relationship !== 'restorable'
  ) {
    relationshipBadges.push('following');
  }
  if (deck.status === 'active') relationshipBadges.push(deck.visibility);

  const studyStats = stats ?? {
    totalWords: 0,
    newWordsAvailable: 0,
    reviewsDue: 0,
    wordsInReview: 0,
  };
  const rowPrimaryAction = getDeckRowPrimaryAction(actionPlan.primary, context, studyStats);
  const introducedCards = Math.min(studyStats.wordsInReview, studyStats.totalWords);
  const languagePair = formatLanguagePair(deck.frontLanguage, deck.backLanguage);
  const activityMetadata = [
    studyStats.totalWords === 0 && deck.currentReleaseId ? 'No words' : null,
    context === 'created' && subscriberCount && subscriberCount > 0
      ? `${subscriberCount} ${subscriberCount === 1 ? 'follower' : 'followers'}`
      : null,
  ].filter((item): item is string => Boolean(item));
  const primaryClassName = layout === 'row' ? 'w-full sm:w-auto' : 'flex-1';
  const primaryAction =
    rowPrimaryAction === 'restore' ? (
      <Button
        size="sm"
        className={primaryClassName}
        isPending={pending === 'restore'}
        onPress={() =>
          run('restore', () => restoreDeckAction(deck.id), 'Could not restore the deck.')
        }
      >
        Restore deck <span className="sr-only">{deck.title}</span>
      </Button>
    ) : rowPrimaryAction === 'review' ? (
      <ButtonLink
        href={`/decks/${deck.id}/review`}
        size="sm"
        className={`${primaryClassName} ${STUDY_TONE_STYLES.review.button}`}
      >
        {layout === 'row' ? 'Review' : 'Review deck'}{' '}
        <span className="sr-only">in {deck.title}</span>
      </ButtonLink>
    ) : rowPrimaryAction === 'learn' ? (
      <ButtonLink
        href={`/decks/${deck.id}/learn`}
        size="sm"
        className={`${primaryClassName} ${STUDY_TONE_STYLES.learning.button}`}
      >
        {layout === 'row' ? 'Learn' : `Learn ${studyStats.newWordsAvailable}`}
        <span className="sr-only"> in {deck.title}</span>
      </ButtonLink>
    ) : rowPrimaryAction === 'open' ? (
      <ButtonLink
        href={`/decks/${deck.id}`}
        size="sm"
        variant="secondary"
        className={primaryClassName}
      >
        Open deck <span className="sr-only">{deck.title}</span>
      </ButtonLink>
    ) : rowPrimaryAction === 'manage' ? (
      <ButtonLink
        href={`/decks/${deck.id}/edit`}
        size="sm"
        variant="secondary"
        className={primaryClassName}
      >
        Manage deck <span className="sr-only">{deck.title}</span>
      </ButtonLink>
    ) : (
      <Button
        size="sm"
        className={`${primaryClassName} ${STUDY_TONE_STYLES.learning.button}`}
        isPending={pending === 'follow'}
        onPress={handleFollow}
      >
        Follow deck <span className="sr-only">{deck.title}</span>
      </Button>
    );
  const menuAction =
    actionPlan.menu.length > 0 ? (
      <Popover isOpen={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <Button
          variant="tertiary"
          size="sm"
          isIconOnly
          isDisabled={pending !== null}
          aria-label={`More actions for ${deck.title}`}
        >
          <EllipsisVerticalIcon className="h-5 w-5" />
        </Button>
        <Popover.Content placement="bottom end">
          <Popover.Dialog className="w-44 p-1">
            <ListBox
              aria-label={`Actions for ${deck.title}`}
              selectionMode="none"
              onAction={handleMenuAction}
            >
              {actionPlan.menu.map(action => (
                <ListBox.Item
                  key={action}
                  id={action}
                  variant={action === 'delete' ? 'danger' : undefined}
                  className={action === 'delete' ? 'text-danger' : undefined}
                >
                  {
                    {
                      copy: 'Copy & edit',
                      delete: 'Delete deck',
                      follow: 'Follow deck',
                      manage: 'Manage deck',
                      review: 'Review deck',
                      restore: 'Restore deck',
                      unfollow: 'Unfollow deck',
                    }[action]
                  }
                </ListBox.Item>
              ))}
            </ListBox>
          </Popover.Dialog>
        </Popover.Content>
      </Popover>
    ) : null;

  const confirmationDialog = (
    <ConfirmationDialog
      isOpen={confirmation !== null}
      onOpenChange={isOpen => {
        if (!isOpen && !pending) setConfirmation(null);
      }}
      title={
        confirmation === 'copy'
          ? `Copy “${deck.title}”?`
          : confirmation === 'unfollow'
            ? `Unfollow “${deck.title}”?`
            : `Delete “${deck.title}”?`
      }
      description={
        confirmation === 'copy'
          ? 'The published release becomes an independent private deck. Source learning progress is not copied.'
          : confirmation === 'unfollow'
            ? 'Updates will stop, but your learning progress will be retained.'
            : 'The deck will be removed from your active decks. If it has no followers, permanent deletion is available immediately; otherwise it remains recoverable for 30 days.'
      }
      confirmLabel={
        confirmation === 'copy'
          ? 'Copy deck'
          : confirmation === 'unfollow'
            ? 'Unfollow deck'
            : 'Delete deck'
      }
      tone={
        confirmation === 'copy' ? 'neutral' : confirmation === 'unfollow' ? 'warning' : 'danger'
      }
      isPending={pending !== null}
      onConfirm={async () => {
        const action = confirmation;
        if (action === 'copy') await handleCopy();
        if (action === 'delete') await handleDelete();
        if (action === 'unfollow') await handleUnfollow();
        setConfirmation(null);
      }}
    />
  );

  if (layout === 'row') {
    return (
      <article className="py-5">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <div className="min-w-0">
              <h3 className="min-w-0 text-lg font-semibold">
                <Link
                  href={`/decks/${deck.id}`}
                  className="break-words rounded-sm hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {deck.title}
                </Link>
              </h3>
            </div>

            <DeckIdentity
              badges={relationshipBadges}
              languagePair={languagePair}
              className="mt-1.5"
            />
            {activityMetadata.length > 0 ? (
              <DeckMetadataLine rows={[activityMetadata]} className="mt-1" />
            ) : null}

            {deck.description ? (
              <p className="mt-2 line-clamp-2 text-sm text-default-500 sm:line-clamp-1">
                {deck.description}
              </p>
            ) : null}

            <DeckWorkload
              reviewsDue={studyStats.reviewsDue}
              newWordsAvailable={studyStats.newWordsAvailable}
              className="mt-2"
            />
            <DeckCoverage
              started={introducedCards}
              total={studyStats.totalWords}
              deckTitle={deck.title}
              className="mt-3 max-w-xl"
            />

            {mutationError ? (
              <StatusAlert status="danger" className="mt-3">
                {mutationError}
              </StatusAlert>
            ) : null}
            {relationship === 'restorable' && deck.status === 'deleted' ? (
              <p className="mt-2 text-xs text-default-500">
                {deck.retentionUntil && deck.retentionUntil.getTime() <= Date.now()
                  ? 'Ready for permanent deletion.'
                  : `Recoverable until ${deck.retentionUntil?.toLocaleDateString() ?? 'an unknown date'}.`}
              </p>
            ) : null}
          </div>

          <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
            {primaryAction}
            {menuAction}
          </div>
        </div>
        {confirmationDialog}
      </article>
    );
  }

  return (
    <Card className="flex h-full w-full flex-col">
      <Card.Header className="pb-2">
        <div className="min-w-0 space-y-1">
          <h3 className="break-words text-lg font-semibold">
            <Link
              href={`/decks/${deck.id}`}
              className="rounded-sm hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {deck.title}
            </Link>
          </h3>
          <p
            className={
              deck.description
                ? 'line-clamp-2 text-sm text-default-500'
                : 'text-sm italic text-default-400'
            }
          >
            {deck.description || 'No description'}
          </p>
          <DeckIdentity
            badges={relationshipBadges}
            languagePair={languagePair}
            className="pt-1.5"
          />
        </div>
      </Card.Header>
      <Card.Content className="flex-1 space-y-3">
        {lessonCount !== undefined || wordCount !== undefined || subscriberCount !== undefined ? (
          <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-default-500">
            {lessonCount !== undefined ? (
              <div>
                <dt className="sr-only">Lessons</dt>
                <dd>
                  {lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'}
                </dd>
              </div>
            ) : null}
            {wordCount !== undefined ? (
              <div>
                <dt className="sr-only">Words</dt>
                <dd>
                  {wordCount} {wordCount === 1 ? 'word' : 'words'}
                </dd>
              </div>
            ) : null}
            {subscriberCount !== undefined ? (
              <div>
                <dt className="sr-only">Followers</dt>
                <dd>
                  {subscriberCount} {subscriberCount === 1 ? 'follower' : 'followers'}
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}
      </Card.Content>
      <Card.Footer>
        <div className="flex w-full flex-col gap-2">
          {mutationError ? <StatusAlert status="danger">{mutationError}</StatusAlert> : null}
          {relationship === 'restorable' && deck.status === 'deleted' ? (
            <p className="text-xs text-default-500">
              {deck.retentionUntil && deck.retentionUntil.getTime() <= Date.now()
                ? 'Ready for permanent deletion.'
                : `Recoverable until ${deck.retentionUntil?.toLocaleDateString() ?? 'an unknown date'}.`}
            </p>
          ) : null}
          <div className="flex items-start gap-2">
            {primaryAction}
            {menuAction}
          </div>
        </div>
      </Card.Footer>
      {confirmationDialog}
    </Card>
  );
}
