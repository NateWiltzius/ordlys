import { describe, expect, it } from 'vitest';
import {
  buildProgressActivitySeries,
  getProgressActivitySummary,
  getProgressWindowStart,
} from './progress-activity';

describe('progress activity', () => {
  const today = new Date('2026-07-20T16:00:00.000Z');

  it('fills missing days through today', () => {
    expect(
      buildProgressActivitySeries(
        [{ day: '2026-07-19', wordsPracticed: 3, attempts: 6, correctAttempts: 5 }],
        3,
        today,
      ),
    ).toEqual([
      { day: '2026-07-18', wordsPracticed: 0, attempts: 0, correctAttempts: 0 },
      { day: '2026-07-19', wordsPracticed: 3, attempts: 6, correctAttempts: 5 },
      { day: '2026-07-20', wordsPracticed: 0, attempts: 0, correctAttempts: 0 },
    ]);
  });

  it('starts the requested inclusive UTC window', () => {
    expect(getProgressWindowStart(28, today).toISOString()).toBe('2026-06-23T00:00:00.000Z');
  });

  it('summarizes accuracy, activity, and streaks', () => {
    const activity = buildProgressActivitySeries(
      [
        { day: '2026-07-17', wordsPracticed: 2, attempts: 4, correctAttempts: 3 },
        { day: '2026-07-19', wordsPracticed: 2, attempts: 3, correctAttempts: 2 },
        { day: '2026-07-20', wordsPracticed: 2, attempts: 3, correctAttempts: 3 },
      ],
      4,
      today,
    );

    expect(getProgressActivitySummary(activity)).toEqual({
      attempts: 10,
      correctAttempts: 8,
      activeDays: 3,
      accuracyPercentage: 80,
      currentStreak: 2,
      longestStreak: 2,
    });
  });

  it('keeps a streak alive through an inactive current day', () => {
    const activity = buildProgressActivitySeries(
      [
        { day: '2026-07-18', wordsPracticed: 1, attempts: 2, correctAttempts: 2 },
        { day: '2026-07-19', wordsPracticed: 1, attempts: 2, correctAttempts: 1 },
      ],
      3,
      today,
    );

    expect(getProgressActivitySummary(activity).currentStreak).toBe(2);
  });
});
