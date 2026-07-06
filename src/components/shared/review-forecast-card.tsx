'use client';

import { Card } from '@heroui/react';
import { useEffect, useState } from 'react';
import { STUDY_TONE_STYLES } from '@/lib/study-colors';
import type { NextReviewBatch, ReviewForecast } from '@/types/review.types';
import NextReviewText from '@/components/shared/next-review-text';

type Props = {
  forecast: ReviewForecast;
  title?: string;
  description?: string;
  nextReview?: NextReviewBatch | null;
};

export default function ReviewForecastCard({
  forecast,
  title = 'Review forecast',
  description = 'Reviews scheduled over the next 24 hours.',
  nextReview,
}: Props) {
  const [hasMounted, setHasMounted] = useState(false);
  const maxCount = Math.max(...forecast.hours.map(item => item.count), 1);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <Card>
      <Card.Header className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h2 className="card__title">{title}</h2>
          <Card.Description>{description}</Card.Description>
          {nextReview !== undefined && forecast.dueNow === 0 ? (
            <NextReviewText
              nextReview={nextReview}
              className="mt-1 block text-sm text-default-500"
            />
          ) : null}
        </div>
        <div
          className={`flex shrink-0 items-center justify-between gap-3 rounded-lg border px-3 py-2 sm:block sm:text-right ${
            forecast.dueNow > 0
              ? STUDY_TONE_STYLES.review.surface
              : 'border-default-200 bg-default-50'
          }`}
        >
          <p className="text-xs text-default-500">Due now</p>
          <p
            className={`text-xl font-semibold ${
              forecast.dueNow > 0 ? STUDY_TONE_STYLES.review.text : 'text-default-400'
            }`}
          >
            {forecast.dueNow}
          </p>
        </div>
      </Card.Header>
      <Card.Content>
        <div className="w-full min-w-0">
          <div className="grid h-40 w-full grid-cols-24 gap-px border-b border-default-200 sm:h-48 sm:gap-1">
            {forecast.hours.map(item => {
              const date = new Date(item.hour);
              const hourLabel = hasMounted ? String(date.getHours()).padStart(2, '0') : '';
              const fullLabel = hasMounted
                ? new Intl.DateTimeFormat(undefined, {
                    weekday: 'short',
                    hour: 'numeric',
                    minute: '2-digit',
                  }).format(date)
                : item.label;
              const height = item.count === 0 ? 2 : Math.max((item.count / maxCount) * 100, 8);

              return (
                <div
                  key={item.hour}
                  className="relative flex min-w-0 flex-col items-center justify-end gap-2"
                  title={`${fullLabel}: ${item.count} ${item.count === 1 ? 'review' : 'reviews'}`}
                >
                  <div className="relative flex h-28 w-full items-end sm:h-36">
                    {item.count > 0 ? (
                      <span
                        className="absolute left-1/2 -translate-x-1/2 text-[9px] font-semibold text-foreground sm:text-xs"
                        style={{ bottom: `calc(${height}% + 0.2rem)` }}
                      >
                        {item.count}
                      </span>
                    ) : null}
                    <div
                      role="img"
                      className={`w-full rounded-t-sm ${
                        item.count > 0 ? STUDY_TONE_STYLES.review.progress : 'bg-default-200'
                      }`}
                      style={{ height: `${height}%` }}
                      aria-label={`${fullLabel}: ${item.count} ${
                        item.count === 1 ? 'review' : 'reviews'
                      }`}
                    />
                  </div>
                  <span className="h-4 whitespace-nowrap font-mono text-[7px] tabular-nums text-default-400 sm:text-[10px]">
                    {hourLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-default-400">
          <span>Next batch</span>
          <span>Next 24 hours</span>
        </div>
      </Card.Content>
    </Card>
  );
}
