'use client';

import {
  readPendingQuizAttempts,
  writePendingQuizAttempts,
} from '@/lib/quiz/pending-quiz-attempts';
import { saveQuizAttemptAction } from '@/server/review.actions';
import type { QuizSessionAction } from '@/hooks/use-quiz-session';
import type { SaveQuizAttemptInput } from '@/types/quiz.types';
import { useCallback, useEffect, useRef, useState, type Dispatch } from 'react';

export function useQuizAttemptPersistence(
  sessionCardIds: ReadonlySet<number>,
  dispatchSession: Dispatch<QuizSessionAction>,
) {
  const [pendingSaveCount, setPendingSaveCount] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const pendingAttemptsRef = useRef<Map<string, SaveQuizAttemptInput>>(new Map());
  const failedAttemptKeysRef = useRef<Set<string>>(new Set());
  const inFlightAttemptKeysRef = useRef<Set<string>>(new Set());

  const saveAttempt = useCallback(
    (attempt: SaveQuizAttemptInput) => {
      pendingAttemptsRef.current.set(attempt.idempotencyKey, attempt);
      writePendingQuizAttempts(pendingAttemptsRef.current.values());
      if (inFlightAttemptKeysRef.current.has(attempt.idempotencyKey)) return;

      inFlightAttemptKeysRef.current.add(attempt.idempotencyKey);
      setPendingSaveCount(count => count + 1);

      void saveQuizAttemptAction(attempt)
        .then(result => {
          if (result.transition && sessionCardIds.has(attempt.vocabId)) {
            dispatchSession({
              type: 'srs_transition_recorded',
              vocabId: attempt.vocabId,
              transition: result.transition,
            });
          }
          pendingAttemptsRef.current.delete(attempt.idempotencyKey);
          failedAttemptKeysRef.current.delete(attempt.idempotencyKey);
          writePendingQuizAttempts(pendingAttemptsRef.current.values());
          if (failedAttemptKeysRef.current.size === 0) setSaveError(null);
          if (pendingAttemptsRef.current.size === 0) setSaveNotice(null);
        })
        .catch(() => {
          failedAttemptKeysRef.current.add(attempt.idempotencyKey);
          setSaveError(
            'Some answers have not been saved yet. They are stored in this tab and can be retried.',
          );
        })
        .finally(() => {
          inFlightAttemptKeysRef.current.delete(attempt.idempotencyKey);
          setPendingSaveCount(count => Math.max(0, count - 1));
        });
    },
    [dispatchSession, sessionCardIds],
  );

  const retryFailedSaves = useCallback(() => {
    const attempts = Array.from(pendingAttemptsRef.current.values());
    failedAttemptKeysRef.current.clear();
    setSaveError(null);
    setSaveNotice('Retrying saved answers…');
    for (const attempt of attempts) saveAttempt(attempt);
  }, [saveAttempt]);

  useEffect(() => {
    const recoveredAttempts = readPendingQuizAttempts();
    if (recoveredAttempts.length === 0) return;

    setSaveNotice(
      `Retrying ${recoveredAttempts.length} unsaved ${
        recoveredAttempts.length === 1 ? 'answer' : 'answers'
      } from this tab.`,
    );
    for (const attempt of recoveredAttempts) saveAttempt(attempt);
  }, [saveAttempt]);

  useEffect(() => {
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (pendingAttemptsRef.current.size === 0) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, []);

  const exitQuiz = useCallback(() => {
    if (
      pendingAttemptsRef.current.size > 0 &&
      !window.confirm(
        'Some answers are still waiting to save. Leave now? Ordlys will retry them when you next open a quiz in this tab.',
      )
    ) {
      return;
    }
    window.location.assign('/dashboard');
  }, []);

  return {
    exitQuiz,
    pendingSaveCount,
    retryFailedSaves,
    saveAttempt,
    saveError,
    saveNotice,
  };
}
