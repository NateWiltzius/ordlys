'use client';

import { subscribeUserToDeckAction } from '@/server/deck-subscription.actions';
import { Button } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SubscribeDeckButton({ deckId }: { deckId: number }) {
  const router = useRouter();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    if (isSubscribing) return;

    try {
      setIsSubscribing(true);
      setError(null);
      await subscribeUserToDeckAction(deckId);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not follow this deck.');
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className="w-full space-y-2">
      <Button
        type="button"
        variant="primary"
        className="w-full"
        isPending={isSubscribing}
        onPress={handleSubscribe}
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
