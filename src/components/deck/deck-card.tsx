'use client';

import { useEffect, useState } from 'react';
import { deleteDeckAction } from '@/server/deck.actions';
import { subscribeUserToDeckAction } from '@/server/deck-subscription.actions';
import { Deck } from '@/types/deck.types';
import { Button, Card, Chip } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';

type Props = {
  deck: Deck;
  tab: 'learning' | 'public' | 'owned';
  isSubscribed?: boolean;
};

export function DeckCard({ deck, tab, isSubscribed = false }: Props) {
  const router = useRouter();

  const [subscribed, setSubscribed] = useState(isSubscribed);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setSubscribed(isSubscribed);
  }, [isSubscribed]);

  const handleSubscribe = async () => {
    if (subscribed || isSubscribing) return;

    try {
      setIsSubscribing(true);
      await subscribeUserToDeckAction(deck.id);
      setSubscribed(true);
    } catch (error) {
      console.error('Failed to subscribe to deck', error);
    } finally {
      setIsSubscribing(false);
    }
  };

  const goToDeck = () => router.push(`/decks/${deck.id}`);
  const goToEdit = () => router.push(`/decks/${deck.id}/edit`);
  const goToReview = () => router.push(`/decks/${deck.id}/review`);
  const goToLearn = () => router.push(`/decks/${deck.id}/learn`);

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

  const renderBadge = () => {
    if (tab === 'learning') {
      return (
        <Chip size="sm" variant="primary">
          Learning
        </Chip>
      );
    }

    if (tab === 'owned') {
      return (
        <Chip size="sm" variant="secondary">
          Owned
        </Chip>
      );
    }

    if (subscribed) {
      return (
        <Chip size="sm" variant="soft" color="success">
          Subscribed
        </Chip>
      );
    }

    return (
      <Chip size="sm" variant="tertiary">
        Public
      </Chip>
    );
  };

  const renderActions = () => {
    // New pattern: primary action on the left, overflow menu for secondary actions
    const closeMenu = () => setMenuOpen(false);

    const Primary = (
      <div className="flex-1">
        {subscribed ? (
          <Button
            variant="primary"
            size="sm"
            className="w-full"
            onPress={() => {
              closeMenu();
              goToLearn();
            }}
          >
            Continue learning
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            className="w-full"
            isPending={isSubscribing}
            onPress={async () => {
              await handleSubscribe();
              closeMenu();
            }}
          >
            Start learning
          </Button>
        )}
      </div>
    );

    const MoreMenu = (
      <div className="relative ml-2">
        <Button
          variant="tertiary"
          size="sm"
          onPress={() => setMenuOpen(!menuOpen)}
          aria-haspopup="true"
          aria-expanded={menuOpen}
        >
          <EllipsisVerticalIcon className="h-5 w-5" />
        </Button>

        {menuOpen && (
          <div className="absolute right-0 z-10 mt-2 w-44 rounded-md border bg-white p-2 shadow-lg">
            {tab === 'learning' && (
              <ul role="menu" className="flex flex-col gap-2">
                <li>
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-default-100"
                    onClick={() => {
                      closeMenu();
                      goToReview();
                    }}
                  >
                    Review
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-default-100"
                    onClick={() => {
                      closeMenu();
                      goToDeck();
                    }}
                  >
                    View deck
                  </button>
                </li>
              </ul>
            )}

            {tab === 'owned' && (
              <ul role="menu" className="flex flex-col gap-2">
                <li>
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-default-100"
                    onClick={() => {
                      closeMenu();
                      goToEdit();
                    }}
                  >
                    Edit deck
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-default-100"
                    onClick={() => {
                      closeMenu();
                      goToDeck();
                    }}
                  >
                    View deck
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-danger-600 hover:bg-default-100"
                    onClick={async () => {
                      closeMenu();
                      await handleDelete();
                    }}
                  >
                    Delete
                  </button>
                </li>
              </ul>
            )}

            {tab === 'public' && (
              <ul role="menu" className="flex flex-col gap-2">
                <li>
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-default-100"
                    onClick={() => {
                      closeMenu();
                      goToDeck();
                    }}
                  >
                    View deck
                  </button>
                </li>
              </ul>
            )}
          </div>
        )}
      </div>
    );

    return (
      <div className="flex w-full items-start">
        {Primary}
        {MoreMenu}
      </div>
    );
  };

  return (
    <Card className="flex h-full w-full flex-col border border-default-200 shadow-sm transition">
      <Card.Header className="flex items-start justify-between gap-3 pb-2">
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="text-lg font-semibold">{deck.title}</h3>
          {deck.description ? (
            <p className="line-clamp-2 text-sm text-default-500">{deck.description}</p>
          ) : (
            <p className="text-sm italic text-default-400">No description</p>
          )}
        </div>

        <div className="shrink-0">{renderBadge()}</div>
      </Card.Header>

      <Card.Content className="flex-1 py-2">
        <div className="rounded-lg bg-default-100 px-3 py-2 text-sm text-default-600">
          {tab === 'learning' && 'Keep studying this deck and review any cards that are due.'}
          {tab === 'owned' && 'Manage the deck, edit its content, or start learning it.'}
          {tab === 'public' && 'Discover this deck and add it to your active learning list.'}
        </div>
      </Card.Content>

      <Card.Footer className="pt-2">{renderActions()}</Card.Footer>
    </Card>
  );
}
