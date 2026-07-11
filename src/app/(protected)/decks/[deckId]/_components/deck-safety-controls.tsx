'use client';

import {
  moderationRemoveDeckAction,
  moderationReviewDeckAction,
  permanentlyDeleteFollowProgressAction,
  reportDeckAction,
  restrictedHardDeleteDeckAction,
} from '@/server/deck-release.actions';
import type { Deck } from '@/types/deck.types';
import { Button } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

export default function DeckSafetyControls({
  deckId,
  status,
  isOwned,
  isFollowing,
  canModerate,
}: {
  deckId: number;
  status: Deck['status'];
  isOwned: boolean;
  isFollowing: boolean;
  canModerate: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function run(operation: () => Promise<unknown>, success: string, leave = false) {
    startTransition(async () => {
      try {
        setMessage(null);
        await operation();
        setMessage(success);
        if (leave) router.push('/decks');
        else router.refresh();
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : 'The operation could not be completed.',
        );
      }
    });
  }

  function report() {
    const reason = window.prompt('Why are you reporting this deck?');
    if (!reason?.trim()) return;
    const details = window.prompt('Optional details') ?? undefined;
    run(() => reportDeckAction(deckId, reason, details), 'Report submitted.');
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!isOwned ? (
        <Button size="sm" variant="tertiary" isDisabled={pending} onPress={report}>
          Report
        </Button>
      ) : null}
      {isFollowing ? (
        <Button
          size="sm"
          variant="danger-soft"
          isDisabled={pending}
          onPress={() => {
            if (
              !window.confirm(
                'Permanently delete all progress for this deck? This cannot be undone.',
              )
            )
              return;
            run(() => permanentlyDeleteFollowProgressAction(deckId), 'Progress deleted.', true);
          }}
        >
          Delete progress
        </Button>
      ) : null}
      {canModerate && status !== 'moderation_removed' ? (
        <>
          <Button
            size="sm"
            variant="tertiary"
            isDisabled={pending}
            onPress={() =>
              run(() => moderationReviewDeckAction(deckId), 'Deck marked under review.')
            }
          >
            Mark under review
          </Button>
          <Button
            size="sm"
            variant="danger-soft"
            isDisabled={pending}
            onPress={() => {
              if (
                !window.confirm('Remove this deck for moderation? Learner access will be revoked.')
              )
                return;
              run(() => moderationRemoveDeckAction(deckId), 'Deck removed by moderation.', true);
            }}
          >
            Moderate removal
          </Button>
        </>
      ) : null}
      {isOwned && status === 'deleted' ? (
        <Button
          size="sm"
          variant="danger-soft"
          isDisabled={pending}
          onPress={() => {
            if (
              !window.confirm(
                'Attempt restricted hard deletion? Dependencies will leave a tombstone.',
              )
            )
              return;
            run(
              () => restrictedHardDeleteDeckAction(deckId),
              'Hard-deletion eligibility processed.',
              true,
            );
          }}
        >
          Hard delete
        </Button>
      ) : null}
      {message ? (
        <span role="status" className="text-sm text-default-500">
          {message}
        </span>
      ) : null}
    </div>
  );
}
