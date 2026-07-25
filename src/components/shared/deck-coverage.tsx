import { STUDY_TONE_STYLES } from '@/lib/study-colors';
import { ProgressBar } from '@heroui/react';

type Props = {
  started: number;
  total: number;
  deckTitle: string;
  className?: string;
  size?: 'sm' | 'md';
};

export default function DeckCoverage({
  started,
  total,
  deckTitle,
  className = '',
  size = 'sm',
}: Props) {
  if (total <= 0) return null;

  const boundedStarted = Math.min(Math.max(started, 0), total);
  const percentage = Math.round((boundedStarted / total) * 100);

  return (
    <div className={`space-y-2 ${className}`}>
      <div
        className={`flex flex-wrap items-center justify-between gap-x-3 gap-y-1 ${
          size === 'md' ? 'text-sm' : 'text-xs'
        }`}
      >
        <span className="font-medium text-default-700">
          {boundedStarted} of {total} cards started
        </span>
        <span className="shrink-0 tabular-nums text-default-500">{percentage}%</span>
      </div>
      <ProgressBar
        aria-label={`${deckTitle}: ${boundedStarted} of ${total} cards started`}
        value={percentage}
        size={size}
      >
        <ProgressBar.Track>
          <ProgressBar.Fill className={STUDY_TONE_STYLES.learning.progress} />
        </ProgressBar.Track>
      </ProgressBar>
    </div>
  );
}
