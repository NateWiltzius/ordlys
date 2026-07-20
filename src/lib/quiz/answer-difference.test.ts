import { describe, expect, it } from 'vitest';
import { getAnswerDifference } from './answer-difference';

describe('getAnswerDifference', () => {
  it('isolates the changed middle of an answer', () => {
    expect(getAnswerDifference('remembar', 'remember')).toEqual({
      submitted: { before: 'rememb', changed: 'a', after: 'r' },
      correct: { before: 'rememb', changed: 'e', after: 'r' },
    });
  });

  it('preserves composed characters while comparing normalized values', () => {
    expect(getAnswerDifference('cafe\u0301x', 'café')).toEqual({
      submitted: { before: 'café', changed: 'x', after: '' },
      correct: { before: 'café', changed: '', after: '' },
    });
  });

  it('does not produce a difference for accepted normalization changes or an empty answer', () => {
    expect(getAnswerDifference('  ANSWER ', 'answer')).toBeNull();
    expect(getAnswerDifference('', 'answer')).toBeNull();
  });
});
