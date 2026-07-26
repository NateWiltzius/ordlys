'use client';

import { isActionFailure } from '@/lib/action-result';
import { useRouter } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';

export type PublicationOperation = 'publish' | 'visibility' | 'copyPolicy' | 'archive' | 'delete';

type PublicationFeedback = {
  status: 'success' | 'danger';
  text: string;
};

export function usePublicationActions() {
  const router = useRouter();
  const [feedback, setFeedback] = useState<PublicationFeedback | null>(null);
  const [activeOperation, setActiveOperation] = useState<PublicationOperation | null>(null);
  const [pending, startTransition] = useTransition();

  const run = useCallback(
    (
      operationName: PublicationOperation,
      operation: () => Promise<unknown>,
      success: string,
      leavePage = false,
    ) => {
      setFeedback(null);
      setActiveOperation(operationName);

      startTransition(async () => {
        try {
          const result = await operation();
          if (isActionFailure(result)) {
            setFeedback({ status: 'danger', text: result.message });
            return;
          }

          setFeedback({ status: 'success', text: success });
          if (leavePage) router.push('/decks');
          else router.refresh();
        } catch (error) {
          setFeedback({
            status: 'danger',
            text: error instanceof Error ? error.message : 'The operation could not be completed.',
          });
        } finally {
          setActiveOperation(null);
        }
      });
    },
    [router],
  );

  return { activeOperation, feedback, pending, run };
}
