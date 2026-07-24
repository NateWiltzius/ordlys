import SkeletonBlock from '@/components/shared/skeleton/skeleton-block';
import SkeletonLine from '@/components/shared/skeleton/skeleton-line';

export default function DashboardDeckListSkeleton() {
  return (
    <section className="border-t border-default-200 pt-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <SkeletonLine className="h-6 w-28" />
          <SkeletonLine className="h-4 w-80 max-w-full" />
        </div>
        <SkeletonBlock className="h-8 w-24 rounded-lg" />
      </div>
      <div className="mt-4 divide-y divide-default-200">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="py-4">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <SkeletonBlock className="size-10 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                  <SkeletonLine className="h-5 w-48 max-w-full" />
                  <SkeletonLine className="h-4 w-full max-w-xl" />
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                <SkeletonBlock className="h-5 w-14 rounded-full" />
                <SkeletonBlock className="h-5 w-14 rounded-full" />
                <SkeletonBlock className="h-8 w-16 rounded-lg" />
                <SkeletonBlock className="h-8 w-14 rounded-lg" />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <SkeletonLine className="h-3 w-36" />
              <SkeletonLine className="h-3 w-8" />
            </div>
            <SkeletonBlock className="mt-2 h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    </section>
  );
}
