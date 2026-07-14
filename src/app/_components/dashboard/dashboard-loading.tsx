import {
  DashboardDeckListSkeleton,
  PageHeaderSkeleton,
  ReviewForecastSkeleton,
  SrsDistributionSkeleton,
  StudyActionCardSkeleton,
} from '@/components/shared/skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading dashboard" aria-busy="true">
      <span className="sr-only">Loading dashboard…</span>
      <PageHeaderSkeleton actionCount={1} />
      <div className="grid gap-4 md:grid-cols-2">
        <StudyActionCardSkeleton />
        <StudyActionCardSkeleton />
      </div>
      <ReviewForecastSkeleton />
      <SrsDistributionSkeleton />
      <DashboardDeckListSkeleton />
    </div>
  );
}
