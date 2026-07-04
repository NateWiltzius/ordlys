'use client';

import { unsubscribeUserFromDeckAction } from '@/server/deck-subscription.actions';
import { Button } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  deckId: number;
};

export default function UnsubscribeDeckButton({ deckId }: Props) {
  const router = useRouter();
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);

  const handleUnsubscribe = async () => {
    if (isUnsubscribing) return;

    try {
      setIsUnsubscribing(true);
      await unsubscribeUserFromDeckAction(deckId);
      router.push('/decks');
      router.refresh();
    } finally {
      setIsUnsubscribing(false);
    }
  };

  return (
    <Button variant="danger-soft" isPending={isUnsubscribing} onPress={handleUnsubscribe}>
      Unsubscribe
    </Button>
  );
}
