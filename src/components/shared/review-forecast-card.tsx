'use client';

import { useEffect, useState } from 'react';
import { STUDY_TONE_STYLES } from '@/lib/study-colors';
import type { NextReviewBatch, ReviewForecast } from '@/types/review.types';
import NextReviewText from '@/components/shared/next-review-text';
import CollapsiblePanel from '@/components/shared/collapsible-panel';

type Props = {
  forecast: ReviewForecast;
  title?: string;
  description?: string;
  nextReview?: NextReviewBatch | null;
  collapsible?: boolean;
  defaultOpen?: boolean;
};

export default function ReviewForecastCard({
  forecast,
  title = 'Review schedule',
  description = 'Reviews scheduled over the next 24 hours.',
  nextReview,
  collapsible = false,
  defaultOpen = false,
}: Props) {
  const [hasMounted, setHasMounted] = useState(false);
  const maxCount = Math.max(...forecast.hours.map(item => item.count), 1);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const forecastChart = (
    <>
      <div className="w-full min-w-0">
        <div className="grid h-40 w-full grid-cols-24 gap-px border-b border-default-200 sm:h-48 sm:gap-1">
          {forecast.hours.map((item, index) => {
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
                <span
                  className={`h-4 whitespace-nowrap font-mono text-[10px] tabular-nums text-default-400 ${
                    index % 3 === 0 ? '' : 'invisible sm:visible'
                  }`}
                >
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
    </>
  );
  return (
    <CollapsiblePanel
      title={title}
      open={defaultOpen || !collapsible}
      description={
        <div className="h-6 truncate">
          {nextReview ? (
            <NextReviewText nextReview={nextReview} />
          ) : nextReview === null ? (
            'No upcoming reviews scheduled.'
          ) : (
            description
          )}
        </div>
      }
    >
      {forecastChart}
    </CollapsiblePanel>
  );
}
