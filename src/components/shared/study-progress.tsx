import { STUDY_TONE_STYLES, type StudyTone } from '@/lib/study-colors';
import { ProgressBar } from '@heroui/react';
import type { ReactNode } from 'react';

type Props = {
  label: ReactNode;
  counter: ReactNode;
  value: number;
  ariaLabel: string;
  tone: StudyTone;
  details?: ReactNode;
};

export default function StudyProgress({ label, counter, value, ariaLabel, tone, details }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex min-h-10 items-start justify-between gap-3 text-sm">
        <div className="min-w-0 text-default-500">{label}</div>
        <div className="shrink-0 font-medium tabular-nums">{counter}</div>
      </div>
      <ProgressBar aria-label={ariaLabel} value={value}>
        <ProgressBar.Track>
          <ProgressBar.Fill className={STUDY_TONE_STYLES[tone].progress} />
        </ProgressBar.Track>
      </ProgressBar>
      {details ? <div className="text-xs text-default-500">{details}</div> : null}
    </div>
  );
}
