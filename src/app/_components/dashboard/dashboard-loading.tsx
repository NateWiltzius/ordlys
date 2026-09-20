import PageHeader from '@/components/shared/layout/page-header';
import {
  DashboardDeckListSkeleton,
  ReviewForecastSkeleton,
  StudyActionCardSkeleton,
} from '@/components/shared/skeleton';

export default function DashboardLoading({ showHeader = true }: { showHeader?: boolean }) {
  return (
    <div className="space-y-6" role="status" aria-label="Loading Today" aria-busy="true">
      <span className="sr-only">Loading Today…</span>
      {showHeader ? (
        <PageHeader
          title="Today"
          description="Start what is ready now and keep your learning moving."
        />
      ) : null}
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
