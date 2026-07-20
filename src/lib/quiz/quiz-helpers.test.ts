import { describe, expect, it } from 'vitest';
import { getQuizAttemptOutcome } from './quiz-helpers';

describe('getQuizAttemptOutcome', () => {
  it('treats an automatically correct answer as accepted', () => {
    expect(
      getQuizAttemptOutcome({
        isCorrect: true,
        wasOverridden: false,
        failedEarlier: false,
      }),
    ).toEqual({
      isAccepted: true,
      cardWasCorrect: true,
      shouldMarkMissed: false,
    });
  });

  it('treats an overridden answer as accepted for the session and SRS', () => {
    expect(
      getQuizAttemptOutcome({
        isCorrect: false,
        wasOverridden: true,
        failedEarlier: false,
      }),
    ).toEqual({
      isAccepted: true,
      cardWasCorrect: true,
      shouldMarkMissed: false,
    });
  });

  it('does not erase a genuine earlier miss on the same card', () => {
    expect(
      getQuizAttemptOutcome({
        isCorrect: false,
        wasOverridden: true,
        failedEarlier: true,
      }),
    ).toEqual({
      isAccepted: true,
      cardWasCorrect: false,
      shouldMarkMissed: false,
    });
  });

  it('marks a rejected answer as missed', () => {
    expect(
      getQuizAttemptOutcome({
        isCorrect: false,
        wasOverridden: false,
        failedEarlier: false,
      }),
    ).toEqual({
      isAccepted: false,
      cardWasCorrect: false,
      shouldMarkMissed: true,
    });
  });
});
