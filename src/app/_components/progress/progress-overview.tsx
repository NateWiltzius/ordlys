import { BookOpenIcon, CheckBadgeIcon, FireIcon, SparklesIcon } from '@heroicons/react/24/outline';
import type { ComponentType, SVGProps } from 'react';
import { getProgressActivitySummary, PROGRESS_ACTIVITY_WINDOW_DAYS } from '@/lib/progress-activity';
import type { ProgressPageData } from '@/types/progress.types';

type Props = {
  data: Pick<ProgressPageData, 'activity' | 'srsCategoryCounts' | 'startedWords' | 'totalWords'>;
};

type OverviewStatProps = {
  label: string;
  value: string | number;
  detail: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  iconClassName: string;
};

function OverviewStat({ label, value, detail, icon: Icon, iconClassName }: OverviewStatProps) {
  return (
    <div className="rounded-lg border border-default-200 bg-default-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-default-500">{label}</p>
          <p className="mt-2 whitespace-nowrap text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">
            {value}
          </p>
        </div>
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-default-500">{detail}</p>
    </div>
  );
}

export default function ProgressOverview({ data }: Props) {
  const activitySummary = getProgressActivitySummary(data.activity);
  const strongWords =
    data.srsCategoryCounts.strong + data.srsCategoryCounts.mature + data.srsCategoryCounts.mastered;
  const startedPercentage =
    data.totalWords === 0 ? 0 : Math.round((data.startedWords / data.totalWords) * 100);
  const strongPercentage =
    data.startedWords === 0 ? 0 : Math.round((strongWords / data.startedWords) * 100);

  return (
    <section aria-label="Progress overview">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <OverviewStat
          label="Cards started"
          value={data.startedWords}
          detail={`${startedPercentage}% of ${data.totalWords} available ${
            data.totalWords === 1 ? 'card' : 'cards'
          }`}
          icon={BookOpenIcon}
          iconClassName="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        />
        <OverviewStat
          label="Strong or better"
          value={strongWords}
          detail={`${strongPercentage}% of the cards you have started`}
          icon={SparklesIcon}
          iconClassName="bg-violet-500/10 text-violet-600 dark:text-violet-400"
        />
        <OverviewStat
          label="Answer accuracy"
          value={
            activitySummary.accuracyPercentage === null
              ? '—'
              : `${activitySummary.accuracyPercentage}%`
          }
          detail={
            activitySummary.attempts === 0
              ? `No answers in the last ${PROGRESS_ACTIVITY_WINDOW_DAYS} days`
              : `${activitySummary.correctAttempts} of ${activitySummary.attempts} answers correct`
          }
          icon={CheckBadgeIcon}
          iconClassName="bg-success/10 text-success"
        />
        <OverviewStat
          label="Current streak"
          value={`${activitySummary.currentStreak} ${
            activitySummary.currentStreak === 1 ? 'day' : 'days'
          }`}
          detail={`Best in this ${PROGRESS_ACTIVITY_WINDOW_DAYS}-day view: ${
            activitySummary.longestStreak
          } ${activitySummary.longestStreak === 1 ? 'day' : 'days'}`}
          icon={FireIcon}
          iconClassName="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
      </div>
    </section>
  );
}
