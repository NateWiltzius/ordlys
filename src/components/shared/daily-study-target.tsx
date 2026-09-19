import ButtonLink from '@/components/shared/button-link';

export default function DailyStudyTarget({
  progress,
}: {
  progress: { introducedToday: number; dailyNewWordTarget: number; timeZone: string };
}) {
  return (
    <div className="space-y-2 rounded-lg border border-default-200 p-4">
      <p className="font-medium">
        {progress.introducedToday} of {progress.dailyNewWordTarget} new cards today
      </p>
      <p className="text-sm text-default-500">
        {progress.introducedToday >= progress.dailyNewWordTarget
          ? 'Daily target reached. Review what you’ve learned, or keep learning if you feel ready.'
          : 'Your daily target covers all decks. Try reviewing due cards before adding more.'}{' '}
        Day resets at midnight ({progress.timeZone}).
      </p>
      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/review" variant="secondary">
          Review due cards
        </ButtonLink>
        <ButtonLink href="/account" variant="secondary">
          Learning preferences
        </ButtonLink>
      </div>
    </div>
  );
}
