'use client';

import { useEffect, useState } from 'react';
import { deleteDeckAction } from '@/server/deck.actions';
import {
  subscribeUserToDeckAction,
  unsubscribeUserFromDeckAction,
} from '@/server/deck-subscription.actions';
import { Deck } from '@/types/deck.types';
import { Button, Card, Chip, ListBox, Popover } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';

type Props = {
  deck: Deck;
  tab: 'learning' | 'public' | 'owned';
  isSubscribed?: boolean;
};

type DeckAction = 'review' | 'view' | 'edit' | 'delete' | 'unsubscribe';

export function DeckCard({ deck, tab, isSubscribed = false }: Props) {
  const router = useRouter();

  const [subscribed, setSubscribed] = useState(isSubscribed);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setSubscribed(isSubscribed);
  }, [isSubscribed]);

  const handleSubscribe = async () => {
    if (subscribed || isSubscribing) return;

    try {
      setIsSubscribing(true);
      await subscribeUserToDeckAction(deck.id);
      setSubscribed(true);
      router.refresh();
    } catch (error) {
      console.error('Failed to subscribe to deck', error);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;

    try {
      setIsDeleting(true);
      await deleteDeckAction(deck.id);
      router.refresh();
    } catch (error) {
      console.error('Failed to delete deck', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!subscribed || isUnsubscribing) return;

    try {
      setIsUnsubscribing(true);
      await unsubscribeUserFromDeckAction(deck.id);
      setSubscribed(false);
      router.refresh();
    } catch (error) {
      console.error('Failed to unsubscribe from deck', error);
    } finally {
      setIsUnsubscribing(false);
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

  const badge =
    tab === 'learning' ? (
      <Chip size="sm" variant="primary">
        Learning
      </Chip>
    ) : tab === 'owned' ? (
      <Chip size="sm" variant="secondary">
        Owned
      </Chip>
    ) : subscribed ? (
      <Chip size="sm" variant="soft" color="success">
        Subscribed
      </Chip>
    ) : (
      <Chip size="sm" variant="tertiary">
        Public
      </Chip>
    );

  const helperText = {
    learning: deck.deletedAt
      ? 'The owner removed this deck, but your subscription and progress are preserved.'
      : 'Keep studying this deck and review any cards that are due.',
    owned: 'Manage the deck, edit its content, or start learning it.',
    public: 'Discover this deck and add it to your active learning list.',
  }[tab];

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
        <div className="flex w-full items-start gap-2">
          {tab === 'learning' || subscribed ? (
            <Button
              variant="primary"
              size="sm"
              className="flex-1"
              onPress={() => router.push(`/decks/${deck.id}`)}
            >
              View deck
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              className="flex-1"
              isPending={isSubscribing}
              onPress={handleSubscribe}
            >
              Start learning
            </Button>
          )}

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
                  {tab === 'learning' ? (
                    <ListBox.Item id="review" textValue="Review">
                      Review
                    </ListBox.Item>
                  ) : null}

                  {tab === 'owned' ? (
                    <ListBox.Item id="edit" textValue="Edit deck">
                      Edit deck
                    </ListBox.Item>
                  ) : null}

                  {subscribed ? (
                    <ListBox.Item
                      id="unsubscribe"
                      textValue="Unsubscribe"
                      variant="danger"
                      isDisabled={isUnsubscribing}
                    >
                      {isUnsubscribing ? 'Unsubscribing...' : 'Unsubscribe'}
                    </ListBox.Item>
                  ) : null}

                  {(tab === 'public' || tab === 'owned') && !subscribed && (
                    <ListBox.Item id="view" textValue="View deck">
                      View deck
                    </ListBox.Item>
                  )}

                  {tab === 'owned' ? (
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
      </Card.Footer>
    </Card>
  );
}
