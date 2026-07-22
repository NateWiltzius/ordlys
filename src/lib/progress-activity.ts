import type { ProgressActivityDay } from '@/types/progress.types';

export const PROGRESS_ACTIVITY_WINDOW_DAYS = 28;
export const PROGRESS_CHART_DAYS = 7;

function utcDayStart(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function getProgressDayKey(date: Date) {
  return utcDayStart(date).toISOString().slice(0, 10);
}

export function getProgressWindowStart(totalDays: number, today = new Date()) {
  const start = utcDayStart(today);
  start.setUTCDate(start.getUTCDate() - Math.max(0, totalDays - 1));
  return start;
}

export function buildProgressActivitySeries(
  rows: ProgressActivityDay[],
  totalDays = PROGRESS_ACTIVITY_WINDOW_DAYS,
  today = new Date(),
): ProgressActivityDay[] {
  const rowsByDay = new Map(rows.map(row => [row.day, row]));
  const start = getProgressWindowStart(totalDays, today);

  return Array.from({ length: totalDays }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    const day = getProgressDayKey(date);
    return (
      rowsByDay.get(day) ?? {
        day,
        wordsPracticed: 0,
        attempts: 0,
        correctAttempts: 0,
      }
    );
  });
}

export function getProgressActivitySummary(activity: ProgressActivityDay[]) {
  const totals = activity.reduce(
    (summary, day) => ({
      attempts: summary.attempts + day.attempts,
      correctAttempts: summary.correctAttempts + day.correctAttempts,
      activeDays: summary.activeDays + (day.attempts > 0 ? 1 : 0),
    }),
    { attempts: 0, correctAttempts: 0, activeDays: 0 },
  );

  let currentStreak = 0;
  let longestStreak = 0;
  let runningStreak = 0;

  for (const day of activity) {
    if (day.attempts > 0) {
      runningStreak += 1;
      longestStreak = Math.max(longestStreak, runningStreak);
    } else {
      runningStreak = 0;
    }
  }

  const lastDayIndex = activity.length - 1;
  const streakEndIndex =
    activity[lastDayIndex]?.attempts > 0 ? lastDayIndex : Math.max(-1, lastDayIndex - 1);

  for (let index = streakEndIndex; index >= 0 && activity[index].attempts > 0; index -= 1) {
    currentStreak += 1;
  }

  return {
    ...totals,
    accuracyPercentage:
      totals.attempts === 0 ? null : Math.round((totals.correctAttempts / totals.attempts) * 100),
    currentStreak,
    longestStreak,
  };
}
