'use client';

import { unsubscribeUserFromDeckAction } from '@/server/deck-subscription.actions';
import { Button } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  deckId: number;
  deckTitle: string;
  isArchived: boolean;
};

export default function UnsubscribeDeckButton({ deckId, deckTitle, isArchived }: Props) {
  const router = useRouter();
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUnsubscribe = async () => {
    if (isUnsubscribing) return;
    const warning = isArchived
      ? `Unsubscribe from “${deckTitle}”? If you are the final subscriber, this archived deck and its learning history will be permanently removed.`
      : `Unsubscribe from “${deckTitle}”? Your current progress can be resumed if the deck remains available and you subscribe again.`;
    if (!window.confirm(warning)) return;

    try {
      setIsUnsubscribing(true);
      setError(null);
      await unsubscribeUserFromDeckAction(deckId);
      router.push('/decks');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not unsubscribe. Please try again.');
    } finally {
      setIsUnsubscribing(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button variant="danger-soft" isPending={isUnsubscribing} onPress={handleUnsubscribe}>
        Unsubscribe
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
