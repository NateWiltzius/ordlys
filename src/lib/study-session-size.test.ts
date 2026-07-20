import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LEARN_SESSION_SIZE,
  DEFAULT_REVIEW_SESSION_SIZE,
  getEstimatedReviewDuration,
  getEstimatedReviewMinutes,
  getSessionSizeChoices,
  parseLearnSessionSize,
  LEARN_SESSION_SIZES,
  parseSessionSize,
  parseReviewSessionSize,
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
    expect(getSessionSizeChoices(REVIEW_SESSION_SIZES, 25)).toEqual([5, 10, 20]);
    expect(getSessionSizeChoices([3, 5, 10, 20], 7)).toEqual([3, 5]);
    expect(getSessionSizeChoices(REVIEW_SESSION_SIZES, 8)).toEqual([5]);
  });

  it('uses the remembered review size when the URL does not choose one', () => {
    expect(parseReviewSessionSize(undefined, '20')).toBe(20);
    expect(parseReviewSessionSize(undefined, 'unsupported')).toBe('all');
    expect(parseReviewSessionSize('5', '20')).toBe(5);
  });

  it('uses a separate remembered learning size when the URL does not choose one', () => {
    expect(parseLearnSessionSize(undefined, '10')).toBe(10);
    expect(parseLearnSessionSize(undefined, 'all')).toBe('all');
    expect(parseLearnSessionSize(undefined, 'unsupported')).toBe(DEFAULT_LEARN_SESSION_SIZE);
    expect(parseLearnSessionSize('3', '10')).toBe(3);
  });

  it('estimates review time at roughly eighteen seconds per card', () => {
    expect(getEstimatedReviewMinutes(5)).toBe(2);
    expect(getEstimatedReviewMinutes(10)).toBe(3);
    expect(getEstimatedReviewMinutes(20)).toBe(6);
    expect(getEstimatedReviewDuration(10)).toBe('about 3 minutes');
  });
});
