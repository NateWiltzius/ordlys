import type { ReviewForecast } from '@/types/review.types';

const FORECAST_HOUR_COUNT = 24;

export function buildReviewForecast(
  countsByBucket: Record<string, number>,
  now = new Date(),
): ReviewForecast {
  const start = startOfUtcHour(now);
  start.setUTCHours(start.getUTCHours() + 1);
  const hours = Array.from({ length: FORECAST_HOUR_COUNT }, (_, index) => {
    const hour = new Date(start);
    hour.setUTCHours(hour.getUTCHours() + index);
    const key = toHourKey(hour);

    return {
      hour: key,
      label: index === 0 ? 'Next batch' : key,
      count: countsByBucket[key] ?? 0,
    };
  });

  return {
    dueNow: countsByBucket.due ?? 0,
    hours,
  };
}

export function getReviewForecastEnd(now = new Date()): Date {
  const end = startOfUtcHour(now);
  end.setUTCHours(end.getUTCHours() + FORECAST_HOUR_COUNT + 1);
  return end;
}

function startOfUtcHour(date: Date): Date {
  const hour = new Date(date);
  hour.setUTCMinutes(0, 0, 0);
  return hour;
}

function toHourKey(date: Date): string {
  return `${date.toISOString().slice(0, 13)}:00:00Z`;
}
