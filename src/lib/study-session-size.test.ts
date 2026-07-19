import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LEARN_SESSION_SIZE,
  DEFAULT_REVIEW_SESSION_SIZE,
  getSessionSizeChoices,
  LEARN_SESSION_SIZES,
  parseSessionSize,
  REVIEW_SESSION_SIZES,
} from './study-session-size';

describe('study session size', () => {
  it('accepts a configured size', () => {
    expect(parseSessionSize('10', LEARN_SESSION_SIZES, DEFAULT_LEARN_SESSION_SIZE)).toBe(10);
  });

  it('falls back when the requested size is unsupported', () => {
    expect(parseSessionSize('999', LEARN_SESSION_SIZES, DEFAULT_LEARN_SESSION_SIZE)).toBe(
      DEFAULT_LEARN_SESSION_SIZE,
    );
  });

  it('accepts all only when the session supports it', () => {
    expect(parseSessionSize('all', LEARN_SESSION_SIZES, DEFAULT_LEARN_SESSION_SIZE, true)).toBe(
      'all',
    );
    expect(parseSessionSize('all', LEARN_SESSION_SIZES, DEFAULT_LEARN_SESSION_SIZE)).toBe(
      DEFAULT_LEARN_SESSION_SIZE,
    );
  });

  it('defaults review sessions to all due cards', () => {
    expect(
      parseSessionSize(undefined, REVIEW_SESSION_SIZES, DEFAULT_REVIEW_SESSION_SIZE, true),
    ).toBe('all');
  });

  it('only offers sizes that create a smaller session than the available queue', () => {
    expect(getSessionSizeChoices([10, 25, 50], 25)).toEqual([10]);
    expect(getSessionSizeChoices([3, 5, 10, 20], 7)).toEqual([3, 5]);
    expect(getSessionSizeChoices([10, 25, 50], 8)).toEqual([]);
  });
});
