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
import DeckBadge, { type DeckBadgeKind } from '@/components/shared/deck-badge';

type Relationship = 'owned' | 'copy' | 'following' | 'discover' | 'restorable';
type Props = {
  deck: Deck;
  relationship: Relationship;
  isFollowing?: boolean;
  subscriberCount?: number;
};
type DeckAction = 'review' | 'view' | 'edit' | 'delete' | 'follow' | 'unfollow';

export function DeckCard({ deck, relationship, isFollowing = false, subscriberCount }: Props) {
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
      setPending(null);
    }
  };

  const handleMenuAction = async (key: React.Key) => {
    setIsMenuOpen(false);
    switch (key as DeckAction) {
      case 'review':
        router.push(`/decks/${deck.id}/review`);
        break;
      case 'view':
        router.push(`/decks/${deck.id}`);
        break;
      case 'edit':
        router.push(`/decks/${deck.id}/edit`);
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

  const relationshipBadges: DeckBadgeKind[] = {
    owned: ['owned'],
    copy: ['copy'],
    following: [],
    discover: [],
    restorable: ['owned', deck.status === 'deleted' ? 'deletion-pending' : 'archived'],
  }[relationship] as DeckBadgeKind[];

  if (following) relationshipBadges.push('following');
  relationshipBadges.push(deck.visibility);

  return (
    <Card className="flex h-full w-full flex-col">
      <Card.Header className="flex items-start justify-between gap-3 pb-2">
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="break-words text-lg font-semibold">{deck.title}</h3>
          <p
            className={
              deck.description
                ? 'line-clamp-2 text-sm text-default-500'
                : 'text-sm italic text-default-400'
            }
          >
            {deck.description || 'No description'}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1">
          {relationshipBadges.map(kind => (
            <DeckBadge key={kind} kind={kind} />
          ))}
        </div>
      </Card.Header>
      <div className="flex-1" />
      <Card.Footer>
        <div className="flex w-full flex-col gap-2">
          {relationship === 'discover' && subscriberCount !== undefined ? (
            <p className="text-sm text-default-500">
              {subscriberCount} {subscriberCount === 1 ? 'follower' : 'followers'}
            </p>
          ) : null}
          {mutationError ? <StatusAlert status="danger">{mutationError}</StatusAlert> : null}
          {relationship === 'restorable' && deck.status === 'deleted' ? (
            <p className="text-xs text-default-500">
              {deck.retentionUntil && deck.retentionUntil.getTime() <= Date.now()
                ? 'Ready for permanent deletion.'
                : `Recoverable until ${deck.retentionUntil?.toLocaleDateString() ?? 'an unknown date'}.`}
            </p>
          ) : null}
          <div className="flex items-start gap-2">
            {relationship === 'restorable' ? (
              <>
                <Button
                  size="sm"
                  className="flex-1"
                  isPending={pending === 'restore'}
                  onPress={() =>
                    run('restore', () => restoreDeckAction(deck.id), 'Could not restore the deck.')
                  }
                >
                  Restore deck
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onPress={() => router.push(`/decks/${deck.id}`)}
                >
                  Open deck
                </Button>
              </>
            ) : relationship !== 'discover' || following ? (
              <Button
                size="sm"
                className={`flex-1 ${relationship === 'following' ? STUDY_TONE_STYLES.learning.button : ''}`}
                onPress={() => router.push(`/decks/${deck.id}`)}
              >
                Open deck
              </Button>
            ) : (
              <Button
                size="sm"
                className={`flex-1 ${STUDY_TONE_STYLES.learning.button}`}
                isPending={pending === 'follow'}
                onPress={handleFollow}
              >
                Follow deck
              </Button>
            )}

            {(relationship === 'discover' || relationship === 'following') &&
            deck.copyPolicy !== 'follow_only' ? (
              <Button
                variant="secondary"
                size="sm"
                isPending={pending === 'copy'}
                onPress={() => setConfirmation('copy')}
              >
                Copy &amp; edit
              </Button>
            ) : null}
            {relationship === 'owned' || relationship === 'copy' ? (
              <Button
                variant="secondary"
                size="sm"
                onPress={() => router.push(`/decks/${deck.id}/edit`)}
              >
                Manage deck
              </Button>
            ) : null}

            {relationship !== 'restorable' ? (
              <Popover isOpen={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <Button
                  variant="tertiary"
                  size="sm"
                  isIconOnly
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
                      {following ? <ListBox.Item id="review">Review</ListBox.Item> : null}
                      {following ? <ListBox.Item id="unfollow">Unfollow deck</ListBox.Item> : null}
                      {(relationship === 'owned' || relationship === 'copy') &&
                      !following &&
                      deck.currentReleaseId ? (
                        <ListBox.Item id="follow">Follow deck</ListBox.Item>
                      ) : null}
                      {relationship === 'discover' && !following ? (
                        <ListBox.Item id="view">Preview deck</ListBox.Item>
                      ) : null}
                      {relationship === 'owned' || relationship === 'copy' ? (
                        <ListBox.Item id="delete" variant="danger" className="text-danger">
                          Delete deck
                        </ListBox.Item>
                      ) : null}
                    </ListBox>
                  </Popover.Dialog>
                </Popover.Content>
              </Popover>
            ) : null}
          </div>
        </div>
      </Card.Footer>
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
    </Card>
  );
}
