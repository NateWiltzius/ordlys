import {
  DashboardDeckListSkeleton,
  PageHeaderSkeleton,
  ReviewForecastSkeleton,
  StudyActionCardSkeleton,
  StudySummarySkeleton,
} from '@/components/shared/skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading dashboard" aria-busy="true">
      <span className="sr-only">Loading dashboard…</span>
      <PageHeaderSkeleton actionCount={1} />
      <StudySummarySkeleton />
      <StudyActionCardSkeleton />
      <ReviewForecastSkeleton />
      <DashboardDeckListSkeleton />
    </div>
  );
}
