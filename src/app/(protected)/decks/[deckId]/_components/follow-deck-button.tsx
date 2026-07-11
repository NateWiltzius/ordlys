'use client';

import { followDeckAction } from '@/server/deck-follow.actions';
import { Button } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  deckId: number;
};

export default function FollowDeckButton({ deckId }: Props) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFollow = async () => {
    if (isFollowing) return;

    try {
      setIsFollowing(true);
      setError(null);
      await followDeckAction(deckId);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not follow this deck.');
    } finally {
      setIsFollowing(false);
    }
  };

  return (
    <div className="w-full space-y-2">
      <Button
        type="button"
        variant="primary"
        className="w-full"
        isPending={isFollowing}
        onPress={handleFollow}
      >
        Follow deck to start learning
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
