'use client';

import { isActionFailure } from '@/lib/action-result';
import { errorMessage } from '@/lib/validation/content';
import type { DeckCardAction } from '@/lib/deck-card-actions';
import { deleteDeckAction } from '@/server/deck.actions';
import { followDeckAction, unfollowDeckAction } from '@/server/deck-follow.actions';
import { forkReleaseAction, restoreDeckAction } from '@/server/deck-release.actions';
import type { Deck } from '@/types/deck.types';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

export type DeckCardConfirmation = 'copy' | 'delete' | 'unfollow';

export function useDeckCardActions(deck: Deck) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<DeckCardConfirmation | null>(null);

  const run = useCallback(
    async (key: string, operation: () => Promise<unknown>, fallback: string) => {
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
    },
    [pending, router],
  );

  const follow = useCallback(
    () => run('follow', () => followDeckAction(deck.id), 'Could not follow the deck.'),
    [deck.id, run],
  );

  const restore = useCallback(
    () => run('restore', () => restoreDeckAction(deck.id), 'Could not restore the deck.'),
    [deck.id, run],
  );

  const copy = useCallback(async () => {
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
  }, [deck.currentReleaseId, pending]);

  const handleConfirmation = useCallback(async () => {
    const action = confirmation;
    if (action === 'copy') await copy();
    if (action === 'delete') {
      await run('delete', () => deleteDeckAction(deck.id), 'Could not delete the deck.');
    }
    if (action === 'unfollow') {
      await run('unfollow', () => unfollowDeckAction(deck.id), 'Could not unfollow the deck.');
    }
    setConfirmation(null);
  }, [confirmation, copy, deck.id, run]);

  const handleMenuAction = useCallback(
    async (key: React.Key) => {
      setIsMenuOpen(false);
      const action = key as DeckCardAction;
      switch (action) {
        case 'review':
          router.push(`/decks/${deck.id}/review`);
          break;
        case 'manage':
          router.push(`/decks/${deck.id}/edit`);
          break;
        case 'copy':
        case 'delete':
        case 'unfollow':
          setConfirmation(action);
          break;
        case 'follow':
          await follow();
          break;
      }
    },
    [deck.id, follow, router],
  );

  return {
    confirmation,
    follow,
    handleConfirmation,
    handleMenuAction,
    isMenuOpen,
    mutationError,
    pending,
    restore,
    setConfirmation,
    setIsMenuOpen,
  };
}
