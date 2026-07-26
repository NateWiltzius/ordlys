'use client';

import { useMountedTimestamp } from '@/hooks/use-mounted-timestamp';
import {
  getSrsCategoryKey,
  getSrsLevelDisplayLabel,
  normalizeSrsLevel,
} from '@/lib/srs/srs-config';
import { SRS_CATEGORY_STYLES } from '@/lib/srs/srs-styles';
import { Chip, Tooltip } from '@heroui/react';

type Props = {
  srsLevel?: number;
  reviewDueAt?: string;
};

export default function SrsLevelChip({ srsLevel, reviewDueAt }: Props) {
  const mountedAt = useMountedTimestamp();

  if (srsLevel === undefined) {
    return (
      <Chip size="sm" variant="soft">
        Not started
      </Chip>
    );
  }

  const normalizedLevel = normalizeSrsLevel(srsLevel);
  const categoryKey = getSrsCategoryKey(normalizedLevel);
  const chip = (
    <Chip size="sm" variant="soft" className={SRS_CATEGORY_STYLES[categoryKey].chip}>
      {getSrsLevelDisplayLabel(normalizedLevel)}
    </Chip>
  );

  if (!reviewDueAt) return chip;

  return (
    <Tooltip delay={300}>
      <Tooltip.Trigger className="inline-flex">{chip}</Tooltip.Trigger>
      <Tooltip.Content>
        {mountedAt === null ? 'Review scheduled' : formatReviewDueAt(reviewDueAt, mountedAt)}
      </Tooltip.Content>
    </Tooltip>
  );
}

function formatReviewDueAt(reviewDueAt: string, nowTimestamp: number): string {
  const dueAt = new Date(reviewDueAt);
  const now = new Date(nowTimestamp);
  if (dueAt <= now) return 'Review due now';

  const today = startOfLocalDay(now);
  const dueDay = startOfLocalDay(dueAt);
  const dayDifference = Math.round((dueDay.getTime() - today.getTime()) / 86_400_000);
  const dayLabel =
    dayDifference === 0
      ? 'today'
      : dayDifference === 1
        ? 'tomorrow'
        : new Intl.DateTimeFormat(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          }).format(dueAt);
  const timeLabel = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(dueAt);

  return `Next review: ${dayLabel} at ${timeLabel}`;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
