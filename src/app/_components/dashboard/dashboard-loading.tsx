import {
  DashboardDeckListSkeleton,
  PageHeaderSkeleton,
  ReviewForecastSkeleton,
  StudySummarySkeleton,
} from '@/components/shared/skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading dashboard" aria-busy="true">
      <span className="sr-only">Loading dashboard…</span>
      <PageHeaderSkeleton actionCount={1} />
      <StudySummarySkeleton />
      <ReviewForecastSkeleton />
      <DashboardDeckListSkeleton />
    </div>
  );
}
