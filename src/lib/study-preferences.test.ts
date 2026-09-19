import { describe, expect, it } from 'vitest';
import { DEFAULT_STUDY_PREFERENCES, validateStudyPreferences } from './study-preferences';

describe('study preferences', () => {
  it('defaults to guided progression and ten cards per day', () => {
    expect(validateStudyPreferences(DEFAULT_STUDY_PREFERENCES)).toEqual({
      strictProgression: false,
      dailyNewWordTarget: 10,
      timeZone: 'UTC',
    });
  });
  it.each([0, -1, 101, 1.5, Number.NaN, '10'])('rejects an invalid target %s', target => {
    expect(() =>
      validateStudyPreferences({
        ...DEFAULT_STUDY_PREFERENCES,
        dailyNewWordTarget: target as number,
      }),
    ).toThrow();
  });
  it('validates the time zone and boolean on the server boundary', () => {
    expect(() =>
      validateStudyPreferences({ ...DEFAULT_STUDY_PREFERENCES, timeZone: 'invalid' }),
    ).toThrow();
    expect(() =>
      validateStudyPreferences({
        ...DEFAULT_STUDY_PREFERENCES,
        strictProgression: 'false' as unknown as boolean,
      }),
    ).toThrow();
    expect(
      validateStudyPreferences({
        ...DEFAULT_STUDY_PREFERENCES,
        timeZone: 'Europe/Berlin',
        strictProgression: true,
      }).strictProgression,
    ).toBe(true);
  });
});
