import { describe, expect, it } from 'vitest';
import {
  getSrsCategoryKey,
  getSrsLevelDisplayLabel,
  LESSON_PROGRESSION_CONFIG,
  normalizeSrsLevel,
  PLACEMENT_TEST_CONFIG,
} from './srs-config';

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

describe('getSrsLevelDisplayLabel', () => {
  it.each([
    [0, 'Learning 1'],
    [2, 'Learning 3'],
    [3, 'Strong 4'],
    [6, 'Mature 7'],
    [8, 'Mastered 9'],
  ] as const)('shows stored SRS level %s as %s', (level, label) => {
    expect(getSrsLevelDisplayLabel(level)).toBe(label);
  });

  it('normalizes levels before displaying them', () => {
    expect(getSrsLevelDisplayLabel(-1)).toBe('Learning 1');
    expect(getSrsLevelDisplayLabel(99)).toBe('Mastered 9');
  });
});

describe('lesson learning boundary', () => {
  it('starts learned words at the first Strong level', () => {
    expect(LESSON_PROGRESSION_CONFIG.learnedSrsLevel).toBe(3);
    expect(LESSON_PROGRESSION_CONFIG.learnedDisplayLevel).toBe(4);
    expect(getSrsCategoryKey(LESSON_PROGRESSION_CONFIG.learnedSrsLevel)).toBe('strong');
  });

  it('places passed words at the same learned boundary', () => {
    expect(PLACEMENT_TEST_CONFIG.passedSrsLevel).toBe(LESSON_PROGRESSION_CONFIG.learnedSrsLevel);
  });
});
