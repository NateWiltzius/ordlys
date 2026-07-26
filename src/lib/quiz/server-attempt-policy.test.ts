import { describe, expect, it } from 'vitest';
import { deriveServerCardOutcome, type RecordedDirectionalAttempt } from './server-attempt-policy';

const correctBtf: RecordedDirectionalAttempt = {
  direction: 'btf',
  isCorrect: true,
  wasOverridden: false,
};

describe('deriveServerCardOutcome', () => {
  it('completes a card only when the other direction was accepted in the same session', () => {
    expect(
      deriveServerCardOutcome({ direction: 'ftb', isCorrect: true, wasOverridden: false }, [
        correctBtf,
      ]),
    ).toEqual({ completesCard: true, cardWasCorrect: true });
  });

  it('does not let repeated accepted attempts apply another transition', () => {
    expect(deriveServerCardOutcome(correctBtf, [correctBtf])).toEqual({
      completesCard: false,
      cardWasCorrect: false,
    });
  });

  it('retains a genuine earlier miss when deriving the card result', () => {
    expect(
      deriveServerCardOutcome({ direction: 'ftb', isCorrect: true, wasOverridden: false }, [
        { direction: 'btf', isCorrect: false, wasOverridden: false },
        correctBtf,
      ]),
    ).toEqual({ completesCard: true, cardWasCorrect: false });
  });

  it('treats an explicit override as accepted without inventing a miss', () => {
    expect(
      deriveServerCardOutcome({ direction: 'ftb', isCorrect: false, wasOverridden: true }, [
        correctBtf,
      ]),
    ).toEqual({ completesCard: true, cardWasCorrect: true });
  });
});
