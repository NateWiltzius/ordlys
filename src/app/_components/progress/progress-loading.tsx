import {
  PageHeaderSkeleton,
  SkeletonBlock,
  SkeletonLine,
  SrsDistributionSkeleton,
} from '@/components/shared/skeleton';

export default function ProgressLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading progress" aria-busy="true">
      <span className="sr-only">Loading progress…</span>
      <PageHeaderSkeleton actionCount={0} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <SkeletonBlock key={index} className="h-36" />
        ))}
      </div>
      <section className="space-y-4 border-t border-default-200 pt-6">
        <div className="space-y-2">
          <SkeletonLine className="h-5 w-32" />
          <SkeletonLine className="h-4 w-64 max-w-full" />
        </div>
        <SkeletonBlock className="h-56" />
      </section>
      <SrsDistributionSkeleton />
      <section className="space-y-4 border-t border-default-200 pt-6">
        <div className="space-y-2">
          <SkeletonLine className="h-5 w-28" />
          <SkeletonLine className="h-4 w-72 max-w-full" />
        </div>
        <SkeletonBlock className="h-36" />
        <SkeletonBlock className="h-36" />
      </section>
    </div>
  );
}
