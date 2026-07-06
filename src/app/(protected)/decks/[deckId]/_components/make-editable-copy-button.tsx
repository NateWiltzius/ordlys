'use client';

import { makeEditableDeckCopyAction } from '@/server/deck-subscription.actions';
import { Button } from '@heroui/react';
import { useState } from 'react';

type Props = {
  deckId: number;
  deckTitle: string;
};

export default function MakeEditableCopyButton({ deckId, deckTitle }: Props) {
  const [isCopying, setIsCopying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCopy = async () => {
    if (isCopying) return;

    const confirmed = window.confirm(
      `Make an editable copy of “${deckTitle}”?\n\n` +
        'Your lessons, words, and current progress will be copied into a new private deck that you own. ' +
        'You will stop following the original deck, and future updates from its author will not affect your copy.',
    );
    if (!confirmed) return;

    try {
      setIsCopying(true);
      setError(null);
      const copiedDeckId = await makeEditableDeckCopyAction(deckId);
      window.location.assign(`/decks/${copiedDeckId}/edit`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not create your editable copy. Please try again.',
      );
      setIsCopying(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button variant="secondary" isPending={isCopying} onPress={handleCopy}>
        Make editable copy
      </Button>
      {error ? (
        <p role="alert" className="max-w-sm text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
