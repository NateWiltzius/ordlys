import { describe, expect, it } from 'vitest';
import { getSrsCategoryKey, normalizeSrsLevel } from './srs-config';

describe('getSrsCategoryKey', () => {
  it.each([
    [0, 'learning'],
    [2, 'learning'],
    [3, 'strong'],
    [5, 'strong'],
    [6, 'mature'],
    [7, 'mature'],
    [8, 'mastered'],
  ] as const)('maps SRS level %s to %s', (level, category) => {
    expect(getSrsCategoryKey(level)).toBe(category);
  });

  it('clamps levels outside the configured range', () => {
    expect(getSrsCategoryKey(-1)).toBe('learning');
    expect(getSrsCategoryKey(99)).toBe('mastered');
  });

  it('normalizes SRS levels for display and category styling', () => {
    expect(normalizeSrsLevel(-1)).toBe(0);
    expect(normalizeSrsLevel(4.9)).toBe(4);
    expect(normalizeSrsLevel(99)).toBe(8);
  });
});
