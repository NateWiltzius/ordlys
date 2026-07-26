import type { QuizDirection } from '../../types/quiz.types';

export type RecordedDirectionalAttempt = {
  direction: QuizDirection;
  isCorrect: boolean;
  wasOverridden: boolean;
};

type ServerCardOutcome = {
  completesCard: boolean;
  cardWasCorrect: boolean;
};

function isAccepted(attempt: RecordedDirectionalAttempt): boolean {
  return attempt.isCorrect || attempt.wasOverridden;
}

/**
 * Derives the one attempt that completes a two-direction card. `previousAttempts`
 * must contain only attempts from the same user, session, mode, and vocabulary.
 */
export function deriveServerCardOutcome(
  currentAttempt: RecordedDirectionalAttempt,
  previousAttempts: RecordedDirectionalAttempt[],
): ServerCardOutcome {
  if (!isAccepted(currentAttempt)) {
    return { completesCard: false, cardWasCorrect: false };
  }

  const oppositeDirection: QuizDirection = currentAttempt.direction === 'btf' ? 'ftb' : 'btf';
  const acceptedCurrentDirectionAlready = previousAttempts.some(
    attempt => attempt.direction === currentAttempt.direction && isAccepted(attempt),
  );
  const acceptedOppositeDirection = previousAttempts.some(
    attempt => attempt.direction === oppositeDirection && isAccepted(attempt),
  );
  const completesCard = !acceptedCurrentDirectionAlready && acceptedOppositeDirection;

  return {
    completesCard,
    cardWasCorrect: completesCard && previousAttempts.every(attempt => isAccepted(attempt)),
  };
}
