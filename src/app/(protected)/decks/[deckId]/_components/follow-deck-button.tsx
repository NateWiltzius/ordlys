'use client';

import { followDeckAction } from '@/server/deck-follow.actions';
import { Button } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import StatusAlert from '@/components/shared/status-alert';
import { isActionFailure } from '@/lib/action-result';

type Props = {
  deckId: number;
  autoFollow?: boolean;
};

export default function FollowDeckButton({ deckId, autoFollow = false }: Props) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attemptedAutoFollow = useRef(false);

  const handleFollow = useCallback(async () => {
    if (isFollowing) return;

    try {
      setIsFollowing(true);
      setError(null);
      const result = await followDeckAction(deckId);
      if (isActionFailure(result)) {
        setError(result.message);
        return;
      }
      router.replace(`/decks/${deckId}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not follow this deck.');
    } finally {
      setIsFollowing(false);
    }
  }, [deckId, isFollowing, router]);

  useEffect(() => {
    if (!autoFollow || attemptedAutoFollow.current) return;

    attemptedAutoFollow.current = true;
    void handleFollow();
  }, [autoFollow, handleFollow]);

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
      {error ? <StatusAlert status="danger">{error}</StatusAlert> : null}
    </div>
  );
}
