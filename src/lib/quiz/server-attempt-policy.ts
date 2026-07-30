import type { QuizDirection } from '../../types/quiz.types';
import type { DeckStudyDirection } from '../deck-study-direction';
import { getRequiredQuizDirections } from './quiz-helpers';

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
 * Derives the one attempt that completes a card's required directions. `previousAttempts`
 * must contain only attempts from the same user, session, mode, and vocabulary.
 */
export function deriveServerCardOutcome(
  currentAttempt: RecordedDirectionalAttempt,
  previousAttempts: RecordedDirectionalAttempt[],
  studyDirection: DeckStudyDirection = 'both',
): ServerCardOutcome {
  if (!isAccepted(currentAttempt)) {
    return { completesCard: false, cardWasCorrect: false };
  }

  const requiredDirections = getRequiredQuizDirections(studyDirection);
  if (!requiredDirections.includes(currentAttempt.direction)) {
    return { completesCard: false, cardWasCorrect: false };
  }

  const acceptedDirectionsBefore = new Set(
    previousAttempts.filter(isAccepted).map(attempt => attempt.direction),
  );
  const completedBefore = requiredDirections.every(direction =>
    acceptedDirectionsBefore.has(direction),
  );
  acceptedDirectionsBefore.add(currentAttempt.direction);
  const completesCard =
    !completedBefore &&
    requiredDirections.every(direction => acceptedDirectionsBefore.has(direction));

  return {
    completesCard,
    cardWasCorrect: completesCard && previousAttempts.every(attempt => isAccepted(attempt)),
  };
}
