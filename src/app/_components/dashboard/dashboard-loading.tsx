import {
  DashboardDeckListSkeleton,
  PageHeaderSkeleton,
  ReviewForecastSkeleton,
  SrsDistributionSkeleton,
  StudyActionCardSkeleton,
} from '@/components/shared/skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading Today" aria-busy="true">
      <span className="sr-only">Loading Today…</span>
      <PageHeaderSkeleton actionCount={0} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StudyActionCardSkeleton />
        <StudyActionCardSkeleton />
        <div className="h-full md:col-span-2 xl:col-span-1">
          <StudyActionCardSkeleton />
        </div>
      </div>
      <ReviewForecastSkeleton />
      <SrsDistributionSkeleton />
      <DashboardDeckListSkeleton />
    </div>
  );
}
