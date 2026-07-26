import {
  DashboardDeckListSkeleton,
  PageHeaderSkeleton,
  ReviewForecastSkeleton,
  StudyActionCardSkeleton,
} from '@/components/shared/skeleton';

export default function DashboardLoading({ showHeader = true }: { showHeader?: boolean }) {
  return (
    <div className="space-y-6" role="status" aria-label="Loading Today" aria-busy="true">
      <span className="sr-only">Loading Today…</span>
      {showHeader ? <PageHeaderSkeleton actionCount={0} descriptionLines={2} /> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StudyActionCardSkeleton descriptionLines={2} />
        <StudyActionCardSkeleton descriptionLines={2} />
        <div className="h-full md:col-span-2 xl:col-span-1">
          <StudyActionCardSkeleton descriptionLines={2} />
        </div>
      </div>
      <ReviewForecastSkeleton />
      <DashboardDeckListSkeleton />
    </div>
  );
}
