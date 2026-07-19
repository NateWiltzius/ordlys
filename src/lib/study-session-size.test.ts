import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LEARN_SESSION_SIZE,
  getFullQueueSessionSize,
  getSessionSizeChoices,
  LEARN_SESSION_SIZES,
  parseSessionSize,
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

  it('only offers sizes that create a smaller session than the available queue', () => {
    expect(getSessionSizeChoices([10, 25, 50], 25)).toEqual([10]);
    expect(getSessionSizeChoices([3, 5, 10, 20], 7)).toEqual([3, 5]);
    expect(getSessionSizeChoices([10, 25, 50], 8)).toEqual([]);
  });

  it('uses the smallest configured ceiling for a full available queue', () => {
    expect(getFullQueueSessionSize([10, 25, 50], 24)).toBe(25);
    expect(getFullQueueSessionSize([10, 25, 50], 25)).toBe(25);
    expect(getFullQueueSessionSize([10, 25, 50], 40)).toBe(50);
    expect(getFullQueueSessionSize([10, 25, 50], 51)).toBeNull();
  });
});
