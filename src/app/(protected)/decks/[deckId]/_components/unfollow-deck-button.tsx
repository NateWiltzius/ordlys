'use client';

import { unfollowDeckAction } from '@/server/deck-follow.actions';
import { Button } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import ConfirmationDialog from '@/components/shared/confirmation-dialog';
import StatusAlert from '@/components/shared/status-alert';
import { isActionFailure } from '@/lib/action-result';

type Props = { deckId: number; deckTitle: string };

export default function UnfollowDeckButton({ deckId, deckTitle }: Props) {
  const router = useRouter();
  const [isUnfollowing, setIsUnfollowing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  async function handleUnfollow() {
    if (isUnfollowing) return;
    try {
      setIsUnfollowing(true);
      setError(null);
      const result = await unfollowDeckAction(deckId);
      if (isActionFailure(result)) {
        setError(result.message);
        return;
      }
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
      <Button variant="danger-soft" isPending={isUnfollowing} onPress={() => setIsConfirming(true)}>
        Unfollow
      </Button>
      {error ? <StatusAlert status="danger">{error}</StatusAlert> : null}
      <ConfirmationDialog
        isOpen={isConfirming}
        onOpenChange={setIsConfirming}
        title={`Unfollow “${deckTitle}”?`}
        description="Author updates will stop, but your progress is retained if you follow the deck again."
        confirmLabel="Unfollow deck"
        isPending={isUnfollowing}
        onConfirm={async () => {
          await handleUnfollow();
          setIsConfirming(false);
        }}
      />
    </div>
  );
}
