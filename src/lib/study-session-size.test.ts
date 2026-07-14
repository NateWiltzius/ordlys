import { describe, expect, it } from 'vitest';
import {
  DEFAULT_REVIEW_SESSION_SIZE,
  getSessionSizeChoices,
  parseSessionSize,
  REVIEW_SESSION_SIZES,
} from './study-session-size';

describe('study session size', () => {
  it('accepts a configured size', () => {
    expect(parseSessionSize('10', REVIEW_SESSION_SIZES, DEFAULT_REVIEW_SESSION_SIZE)).toBe(10);
  });

  it('falls back when the requested size is unsupported', () => {
    expect(parseSessionSize('999', REVIEW_SESSION_SIZES, DEFAULT_REVIEW_SESSION_SIZE)).toBe(
      DEFAULT_REVIEW_SESSION_SIZE,
    );
  });

  it('accepts all only when the session supports it', () => {
    expect(parseSessionSize('all', REVIEW_SESSION_SIZES, DEFAULT_REVIEW_SESSION_SIZE, true)).toBe(
      'all',
    );
    expect(parseSessionSize('all', REVIEW_SESSION_SIZES, DEFAULT_REVIEW_SESSION_SIZE)).toBe(
      DEFAULT_REVIEW_SESSION_SIZE,
    );
  });

  it('only offers sizes that create a smaller session than the available queue', () => {
    expect(getSessionSizeChoices([10, 25, 50], 25)).toEqual([10]);
    expect(getSessionSizeChoices([3, 5, 10, 20], 7)).toEqual([3, 5]);
    expect(getSessionSizeChoices([10, 25, 50], 8)).toEqual([]);
  });
});
