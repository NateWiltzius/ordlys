'use client';

import { Button } from '@heroui/react';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { continueToLessonAction } from '@/server/study-preferences.actions';

export default function ContinueToLesson({
  deckId,
  lessonId,
}: {
  deckId: number;
  lessonId: number;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  return (
    <div className="space-y-2">
      <Button
        variant="secondary"
        isDisabled={pending}
        onPress={() => {
          setError(null);
          startTransition(async () => {
            try {
              await continueToLessonAction(deckId, lessonId);
              router.push(`/decks/${deckId}/learn?lesson=${lessonId}`);
              router.refresh();
            } catch (error) {
              setError(
                error instanceof Error ? error.message : 'Unable to continue. Please try again.',
              );
            }
          });
        }}
      >
        {pending ? 'Opening lesson…' : 'Continue anyway'}
      </Button>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
