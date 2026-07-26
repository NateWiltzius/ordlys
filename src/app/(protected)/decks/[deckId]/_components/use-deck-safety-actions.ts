'use client';

import { isActionFailure } from '@/lib/action-result';
import {
  moderationRemoveDeckAction,
  moderationReviewDeckAction,
  permanentlyDeleteFollowProgressAction,
  reportDeckAction,
  restrictedHardDeleteDeckAction,
} from '@/server/deck-release.actions';
import { followDeckAction, unfollowDeckAction } from '@/server/deck-follow.actions';
import { useRouter } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';

export type DeckSafetyConfirmation =
  | 'delete-progress'
  | 'hard-delete'
  | 'moderate-removal'
  | 'unfollow';

export function useDeckSafetyActions(deckId: number) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    status: 'danger' | 'success';
    message: string;
  } | null>(null);

  const run = useCallback(
    (operation: () => Promise<unknown>, success: string, leave = false) => {
      startTransition(async () => {
        try {
          setFeedback(null);
          const result = await operation();
          if (isActionFailure(result)) {
            setFeedback({ status: 'danger', message: result.message });
            return;
          }
          setFeedback({ status: 'success', message: success });
          if (leave) router.push('/decks');
          else router.refresh();
        } catch (error) {
          setFeedback({
            status: 'danger',
            message:
              error instanceof Error ? error.message : 'The operation could not be completed.',
          });
        }
      });
    },
    [router],
  );

  const follow = useCallback(
    () => run(() => followDeckAction(deckId), 'Deck followed.'),
    [deckId, run],
  );
  const markUnderReview = useCallback(
    () => run(() => moderationReviewDeckAction(deckId), 'Deck marked under review.'),
    [deckId, run],
  );
  const submitReport = useCallback(
    (reason: string, details?: string) =>
      run(() => reportDeckAction(deckId, reason, details), 'Report submitted.'),
    [deckId, run],
  );
  const executeConfirmation = useCallback(
    (action: DeckSafetyConfirmation) => {
      if (action === 'delete-progress') {
        run(() => permanentlyDeleteFollowProgressAction(deckId), 'Progress deleted.', true);
      } else if (action === 'unfollow') {
        run(() => unfollowDeckAction(deckId), 'Deck unfollowed.', true);
      } else if (action === 'moderate-removal') {
        run(() => moderationRemoveDeckAction(deckId), 'Deck removed by moderation.', true);
      } else {
        run(() => restrictedHardDeleteDeckAction(deckId), 'Deletion finalized.', true);
      }
    },
    [deckId, run],
  );

  return {
    executeConfirmation,
    feedback,
    follow,
    markUnderReview,
    pending,
    submitReport,
  };
}
