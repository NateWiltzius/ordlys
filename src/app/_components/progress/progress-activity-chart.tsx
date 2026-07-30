import PageSection from '@/components/shared/layout/page-section';
import { getProgressActivitySummary, PROGRESS_CHART_DAYS } from '@/lib/progress-activity';
import { STUDY_TONE_STYLES } from '@/lib/study-colors';
import type { ProgressActivityDay } from '@/types/progress.types';

type Props = {
  activity: ProgressActivityDay[];
};

function formatDay(day: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(undefined, { ...options, timeZone: 'UTC' }).format(
    new Date(`${day}T00:00:00.000Z`),
  );
}

export default function ProgressActivityChart({ activity }: Props) {
  const chartActivity = activity.slice(-PROGRESS_CHART_DAYS);
  const summary = getProgressActivitySummary(chartActivity);
  const maxWordsPracticed = Math.max(...chartActivity.map(day => day.wordsPracticed), 1);

  return (
    <PageSection
      title="Study activity"
      description={`Distinct cards practiced each day over the last ${PROGRESS_CHART_DAYS} days.`}
      action={
        <p className="pt-1 text-sm text-default-500">
          {summary.activeDays} active {summary.activeDays === 1 ? 'day' : 'days'}
        </p>
      }
    >
      <div
        className="grid h-48 grid-cols-7 gap-2 border-b border-default-200 sm:h-56 sm:gap-3"
        aria-label={`Study activity over the last ${PROGRESS_CHART_DAYS} days`}
      >
        {chartActivity.map(day => {
          const height =
            day.wordsPracticed === 0
              ? 2
              : Math.max(8, Math.round((day.wordsPracticed / maxWordsPracticed) * 100));
          const fullDate = formatDay(day.day, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          });
          const activityLabel = `${fullDate}: ${day.wordsPracticed} ${
            day.wordsPracticed === 1 ? 'card' : 'cards'
          } practiced, ${day.attempts} ${day.attempts === 1 ? 'answer' : 'answers'}, ${
            day.correctAttempts
          } correct`;

          return (
            <div
              key={day.day}
              className="flex min-w-0 flex-col items-center justify-end gap-2"
              title={activityLabel}
            >
              <div className="relative flex h-36 w-full items-end sm:h-44">
                {day.wordsPracticed > 0 ? (
                  <span
                    className="absolute left-1/2 -translate-x-1/2 text-xs font-semibold tabular-nums text-foreground"
                    style={{ bottom: `calc(${height}% + 0.2rem)` }}
                  >
                    {day.wordsPracticed}
                  </span>
                ) : null}
                <div
                  role="img"
                  aria-label={activityLabel}
                  className={`w-full rounded-t-sm ${
                    day.wordsPracticed > 0 ? STUDY_TONE_STYLES.learning.progress : 'bg-default-200'
                  }`}
                  style={{ height: `${height}%` }}
                />
              </div>
              <span className="h-4 whitespace-nowrap text-xs font-medium text-default-400">
                {formatDay(day.day, { weekday: 'narrow' })}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col gap-2 text-sm text-default-500 sm:flex-row sm:items-center sm:justify-between">
        <p>
          {summary.attempts} {summary.attempts === 1 ? 'answer' : 'answers'} ·{' '}
          {summary.correctAttempts} correct
        </p>
        <p>
          {summary.accuracyPercentage === null
            ? 'Accuracy appears after your first answer'
            : `${summary.accuracyPercentage}% answer accuracy`}
        </p>
      </div>
      <p className="mt-2 text-xs text-default-400">
        A card can produce more than one answer when its deck tests both directions or an answer
        needs to be retried.
      </p>
    </PageSection>
  );
}
