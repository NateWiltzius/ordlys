import {
  PageHeaderSkeleton,
  SkeletonBlock,
  SkeletonLine,
  SrsDistributionSkeleton,
} from '@/components/shared/skeleton';

export default function ProgressLoading({ showHeader = true }: { showHeader?: boolean }) {
  return (
    <div className="space-y-6" role="status" aria-label="Loading progress" aria-busy="true">
      <span className="sr-only">Loading progress…</span>
      {showHeader ? <PageHeaderSkeleton actionCount={0} descriptionLines={2} /> : null}
      <section aria-label="Loading progress overview">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="rounded-lg border border-default-200 bg-default-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <SkeletonLine className="h-4 w-24 max-w-full" />
                  <SkeletonLine className="h-8 w-20 max-w-full" />
                </div>
                <SkeletonBlock className="size-10 shrink-0 rounded-lg" />
              </div>
              <SkeletonLine className="mt-3 h-5 w-full" />
            </div>
          ))}
        </div>
      </section>
      <section className="space-y-4 border-t border-default-200 pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <SkeletonLine className="h-6 w-32" />
            <SkeletonLine className="h-4 w-64 max-w-full" />
          </div>
          <SkeletonLine className="h-4 w-24" />
        </div>
        <SkeletonBlock className="h-48 w-full rounded-sm sm:h-56" />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <SkeletonLine className="h-4 w-44" />
          <SkeletonLine className="h-4 w-36" />
        </div>
        <SkeletonLine className="h-3 w-3/4 max-w-2xl" />
      </section>
      <SrsDistributionSkeleton />
      <section className="space-y-4 border-t border-default-200 pt-6">
        <div className="space-y-1">
          <SkeletonLine className="h-6 w-28" />
          <SkeletonLine className="h-4 w-72 max-w-full" />
        </div>
        <div className="divide-y divide-default-200">
          {Array.from({ length: 2 }, (_, index) => (
            <article key={index} className="py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <SkeletonLine className="h-5 w-40 max-w-full" />
                    <SkeletonBlock className="h-5 w-14 rounded-full" />
                    <SkeletonBlock className="h-5 w-14 rounded-full" />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <SkeletonLine className="h-3 w-36" />
                    <SkeletonLine className="h-3 w-8" />
                  </div>
                  <SkeletonBlock className="mt-2 h-2 w-full rounded-full" />
                  <SkeletonBlock className="mt-3 h-2 w-full rounded-full" />
                </div>
                <div className="grid grid-cols-2 gap-2 lg:w-[15rem]">
                  {Array.from({ length: 2 }, (_, statIndex) => (
                    <SkeletonBlock key={statIndex} className="h-16" />
                  ))}
                </div>
                <SkeletonBlock className="h-8 w-full rounded-lg lg:w-24" />
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
