'use client';

import { unfollowDeckAction } from '@/server/deck-follow.actions';
import { Button } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = { deckId: number; deckTitle: string };

export default function UnfollowDeckButton({ deckId, deckTitle }: Props) {
  const router = useRouter();
  const [isUnfollowing, setIsUnfollowing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUnfollow() {
    if (isUnfollowing) return;
    if (
      !window.confirm(
        `Unfollow “${deckTitle}”? Author updates will stop, but your progress is retained if you follow it again.`,
      )
    )
      return;

    try {
      setIsUnfollowing(true);
      setError(null);
      await unfollowDeckAction(deckId);
      router.push('/decks');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not unfollow. Please try again.');
    } finally {
      setIsUnfollowing(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button variant="danger-soft" isPending={isUnfollowing} onPress={handleUnfollow}>
        Unfollow
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
