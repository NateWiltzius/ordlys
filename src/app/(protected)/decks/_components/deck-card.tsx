'use client';

import { useEffect, useState } from 'react';
import { deleteDeckAction } from '@/server/deck.actions';
import {
  makeEditableDeckCopyAction,
  subscribeUserToDeckAction,
  unsubscribeUserFromDeckAction,
} from '@/server/deck-subscription.actions';
import { Deck } from '@/types/deck.types';
import { STUDY_TONE_STYLES } from '@/lib/study-colors';
import { Button, Card, Chip, ListBox, Popover } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { errorMessage } from '@/lib/validation/content';

type Props = {
  deck: Deck;
  relationship: 'owned' | 'copy' | 'following' | 'discover';
  isSubscribed?: boolean;
};

type DeckAction = 'review' | 'view' | 'edit' | 'delete' | 'unsubscribe';

export function DeckCard({ deck, relationship, isSubscribed = false }: Props) {
  const router = useRouter();

  const [subscribed, setSubscribed] = useState(isSubscribed);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  useEffect(() => {
    setSubscribed(isSubscribed);
  }, [isSubscribed]);

  const handleSubscribe = async () => {
    if (subscribed || isSubscribing) return;

    try {
      setMutationError(null);
      setIsSubscribing(true);
      await subscribeUserToDeckAction(deck.id);
      setSubscribed(true);
      router.refresh();
    } catch (error) {
      setMutationError(errorMessage(error, 'Could not follow the deck. Please try again.'));
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    if (!window.confirm(`Delete “${deck.title}”? This cannot be undone.`)) return;

    try {
      setMutationError(null);
      setIsDeleting(true);
      await deleteDeckAction(deck.id);
      router.refresh();
    } catch (error) {
      setMutationError(errorMessage(error, 'Could not delete the deck. Please try again.'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!subscribed || isUnsubscribing) return;
    const warning = deck.deletedAt
      ? `Unfollow “${deck.title}”? If you are the final follower, this archived deck and its learning history will be permanently removed.`
      : `Unfollow “${deck.title}”? You will stop receiving author updates. Your progress can be resumed if the deck remains available and you follow it again.`;
    if (!window.confirm(warning)) return;

    try {
      setMutationError(null);
      setIsUnsubscribing(true);
      await unsubscribeUserFromDeckAction(deck.id);
      setSubscribed(false);
      router.refresh();
    } catch (error) {
      setMutationError(errorMessage(error, 'Could not unfollow the deck. Please try again.'));
    } finally {
      setIsUnsubscribing(false);
    }
  };

  const handleCopy = async () => {
    if (isCopying) return;

    const explanation = subscribed
      ? 'Your lessons, words, and current progress will be copied into a new private deck that you own. You will stop following the original, and future author updates will not affect your copy.'
      : 'The lessons and words will be copied into a new private deck that you own. The copy will be independent and will not receive future updates from the original author.';
    if (!window.confirm(`Make an editable copy of “${deck.title}”?\n\n${explanation}`)) return;

    try {
      setMutationError(null);
      setIsCopying(true);
      const copiedDeckId = await makeEditableDeckCopyAction(deck.id);
      window.location.assign(`/decks/${copiedDeckId}/edit`);
    } catch (error) {
      setMutationError(errorMessage(error, 'Could not create an editable copy. Please try again.'));
      setIsCopying(false);
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
      case 'unsubscribe':
        await handleUnsubscribe();
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
        Editable copy
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
  }[relationship];

  const helperText = {
    owned: 'You own this deck. Open it to study, edit, publish, or manage its content.',
    copy: 'Your independent editable copy. Changes from the original author are not applied.',
    following: deck.deletedAt
      ? 'The author removed this deck, but your read-only access and progress are preserved.'
      : 'Read-only. Updates from the author are applied automatically.',
    discover: 'Follow for author updates, or create a private editable copy.',
  }[relationship];

  return (
    <Card className="flex h-full w-full flex-col border border-default-200 shadow-sm transition">
      <Card.Header className="flex items-start justify-between gap-3 pb-2">
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="break-words text-lg font-semibold">{deck.title}</h3>
          {deck.description ? (
            <p className="line-clamp-2 text-sm text-default-500">{deck.description}</p>
          ) : (
            <p className="text-sm italic text-default-400">No description</p>
          )}
        </div>

        <div className="shrink-0">{badge}</div>
      </Card.Header>

      <Card.Content className="flex-1 py-2">
        <div className="rounded-lg bg-default-100 px-3 py-2 text-sm text-default-600">
          {helperText}
        </div>
      </Card.Content>

      <Card.Footer className="pt-2">
        <div className="flex w-full flex-col gap-2">
          {mutationError ? (
            <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
              {mutationError}
            </p>
          ) : null}
          <div className="flex items-start gap-2">
            {relationship !== 'discover' || subscribed ? (
              <Button
                variant="primary"
                size="sm"
                className={`flex-1 ${
                  relationship === 'following' ? STUDY_TONE_STYLES.learning.button : ''
                }`}
                onPress={() => router.push(`/decks/${deck.id}`)}
              >
                Open deck
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                className={`flex-1 ${STUDY_TONE_STYLES.learning.button}`}
                isPending={isSubscribing}
                onPress={handleSubscribe}
              >
                Follow deck
              </Button>
            )}

            {relationship === 'discover' || relationship === 'following' ? (
              <Button variant="secondary" size="sm" isPending={isCopying} onPress={handleCopy}>
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
                      <ListBox.Item id="review" textValue="Review">
                        Review
                      </ListBox.Item>
                    ) : null}

                    {relationship === 'following' && subscribed ? (
                      <ListBox.Item
                        id="unsubscribe"
                        textValue="Unfollow"
                        variant="danger"
                        isDisabled={isUnsubscribing}
                      >
                        {isUnsubscribing ? 'Unfollowing...' : 'Unfollow'}
                      </ListBox.Item>
                    ) : null}

                    {relationship === 'discover' && !subscribed ? (
                      <ListBox.Item id="view" textValue="View deck">
                        Preview deck
                      </ListBox.Item>
                    ) : null}

                    {relationship === 'owned' || relationship === 'copy' ? (
                      <ListBox.Item
                        id="delete"
                        textValue="Delete"
                        variant="danger"
                        isDisabled={isDeleting}
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </ListBox.Item>
                    ) : null}
                  </ListBox>
                </Popover.Dialog>
              </Popover.Content>
            </Popover>
          </div>
        </div>
      </Card.Footer>
    </Card>
  );
}
