'use client';

import { restoreDeckAction } from '@/server/deck-release.actions';
import { Button } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import StatusAlert from '@/components/shared/status-alert';
import { isActionFailure } from '@/lib/action-result';

type Props = {
  deckId: number;
};

export default function RestoreDeckButton({ deckId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="min-w-0">
      <Button
        className="w-full sm:w-auto"
        variant="secondary"
        isDisabled={pending}
        onPress={() =>
          startTransition(async () => {
            try {
              const result = await restoreDeckAction(deckId);
              if (isActionFailure(result)) {
                setError(result.message);
                return;
              }
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
      {error ? (
        <StatusAlert status="danger" className="mt-2">
          {error}
        </StatusAlert>
      ) : null}
    </div>
  );
}
