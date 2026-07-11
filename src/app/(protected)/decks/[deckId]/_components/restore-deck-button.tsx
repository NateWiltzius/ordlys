'use client';

import { restoreDeckAction } from '@/server/deck-release.actions';
import { Button } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

type Props = {
  deckId: number;
};

export default function RestoreDeckButton({ deckId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <Button
        variant="secondary"
        isDisabled={pending}
        onPress={() =>
          startTransition(async () => {
            try {
              await restoreDeckAction(deckId);
              router.refresh();
            } catch (reason) {
              setError(
                reason instanceof Error ? reason.message : 'The deck could not be restored.',
              );
            }
          })
        }
      >
        {pending ? 'Restoring…' : 'Restore deck'}
      </Button>
      {error ? <p className="mt-1 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
