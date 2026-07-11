'use client';

import { useEffect, useState } from 'react';
import { deleteDeckAction } from '@/server/deck.actions';
import { followDeckAction, unfollowDeckAction } from '@/server/deck-follow.actions';
import { forkReleaseAction, restoreDeckAction } from '@/server/deck-release.actions';
import { Deck } from '@/types/deck.types';
import { STUDY_TONE_STYLES } from '@/lib/study-colors';
import { Button, Card, Chip, ListBox, Popover } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { errorMessage } from '@/lib/validation/content';

type Relationship = 'owned' | 'copy' | 'following' | 'discover' | 'restorable';
type Props = { deck: Deck; relationship: Relationship; isFollowing?: boolean };
type DeckAction = 'review' | 'view' | 'edit' | 'delete' | 'unfollow';

export function DeckCard({ deck, relationship, isFollowing = false }: Props) {
  const router = useRouter();
  const [following, setFollowing] = useState(isFollowing);
  const [pending, setPending] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  useEffect(() => setFollowing(isFollowing), [isFollowing]);

  async function run(key: string, operation: () => Promise<void>, fallback: string) {
    if (pending) return;
    try {
      setPending(key);
      setMutationError(null);
      await operation();
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
        await followDeckAction(deck.id);
        setFollowing(true);
      },
      'Could not follow the deck.',
    );

  const handleUnfollow = async () => {
    if (!window.confirm(`Unfollow “${deck.title}”? Your learning progress will be retained.`))
      return;
    await run(
      'unfollow',
      async () => {
        await unfollowDeckAction(deck.id);
        setFollowing(false);
      },
      'Could not unfollow the deck.',
    );
  };

  const handleDelete = async () => {
    if (!window.confirm(`Soft-delete “${deck.title}”? It can be restored during retention.`))
      return;
    await run('delete', () => deleteDeckAction(deck.id), 'Could not delete the deck.');
  };

  const handleCopy = async () => {
    if (
      !window.confirm(
        `Copy “${deck.title}”? The published release becomes an independent private deck; source learning progress is not copied.`,
      )
    )
      return;
    if (pending) return;
    try {
      setPending('copy');
      if (!deck.currentReleaseId) throw new Error('This deck has no published release.');
      const copiedDeckId = await forkReleaseAction(deck.currentReleaseId, crypto.randomUUID());
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
        await handleDelete();
        break;
      case 'unfollow':
        await handleUnfollow();
        break;
    }
  };

  const badge = {
    owned: (
      <Chip size="sm" variant="secondary">
        Owned
      </Chip>
    ),
    copy: (
      <Chip size="sm" variant="secondary">
        Fork
      </Chip>
    ),
    following: (
      <Chip size="sm" className={STUDY_TONE_STYLES.learning.accent}>
        Following
      </Chip>
    ),
    discover: (
      <Chip size="sm" variant="tertiary">
        Public
      </Chip>
    ),
    restorable: (
      <Chip size="sm" variant="soft" color="warning">
        {deck.status}
      </Chip>
    ),
  }[relationship];

  return (
    <Card className="flex h-full w-full flex-col border border-default-200 shadow-sm">
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
        <div className="shrink-0">{badge}</div>
      </Card.Header>
      <div className="flex-1" />
      <Card.Footer>
        <div className="flex w-full flex-col gap-2">
          {mutationError ? (
            <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
              {mutationError}
            </p>
          ) : null}
          <div className="flex items-start gap-2">
            {relationship === 'restorable' ? (
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
                onPress={handleCopy}
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
                Edit
              </Button>
            ) : null}

            {relationship !== 'restorable' ? (
              <Popover isOpen={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <Button variant="tertiary" size="sm" aria-label={`More actions for ${deck.title}`}>
                  <EllipsisVerticalIcon className="h-5 w-5" />
                </Button>
                <Popover.Content placement="bottom end">
                  <Popover.Dialog className="w-44 p-1">
                    <ListBox
                      aria-label={`Actions for ${deck.title}`}
                      selectionMode="none"
                      onAction={handleMenuAction}
                    >
                      {relationship !== 'discover' ? (
                        <ListBox.Item id="review">Review</ListBox.Item>
                      ) : null}
                      {relationship === 'following' && following ? (
                        <ListBox.Item id="unfollow" variant="danger">
                          Unfollow
                        </ListBox.Item>
                      ) : null}
                      {relationship === 'discover' && !following ? (
                        <ListBox.Item id="view">Preview deck</ListBox.Item>
                      ) : null}
                      {relationship === 'owned' || relationship === 'copy' ? (
                        <ListBox.Item id="delete" variant="danger">
                          Delete
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
    </Card>
  );
}
