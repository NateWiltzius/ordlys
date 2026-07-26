'use client';

import { useMountedTimestamp } from '@/hooks/use-mounted-timestamp';
import type { NextReviewBatch } from '@/types/review.types';

type Props = {
  nextReview: NextReviewBatch | null;
  className?: string;
};

export default function NextReviewText({ nextReview, className = '' }: Props) {
  const mountedAt = useMountedTimestamp();

  if (!nextReview) return;

  if (mountedAt === null) {
    return <span className={className}>Next review batch scheduled.</span>;
  }

  const date = new Date(nextReview.hour);
  const today = startOfLocalDay(new Date(mountedAt));
  const reviewDay = startOfLocalDay(date);
  const dayDifference = Math.round((reviewDay.getTime() - today.getTime()) / 86_400_000);
  const dayLabel =
    dayDifference === 0
      ? 'Today'
      : dayDifference === 1
        ? 'Tomorrow'
        : new Intl.DateTimeFormat(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          }).format(date);
  const hour = String(date.getHours()).padStart(2, '0');

  return (
    <span className={className}>
      Next review: {dayLabel} at {hour} · {nextReview.count}{' '}
      {nextReview.count === 1 ? 'review' : 'reviews'}
    </span>
  );
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
