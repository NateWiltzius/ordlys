import SkeletonBlock from '@/components/shared/skeleton/skeleton-block';
import SkeletonLine from '@/components/shared/skeleton/skeleton-line';

export default function SrsDistributionSkeleton() {
  return (
    <section className="border-t border-default-200 pt-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <SkeletonLine className="h-6 w-36" />
          <SkeletonLine className="h-4 w-72 max-w-full" />
        </div>
        <SkeletonLine className="h-4 w-16" />
      </div>
      <div className="mt-4 space-y-4">
        <SkeletonBlock className="h-3 w-full rounded-full" />
        <div className="grid grid-cols-2 border-y border-default-200 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="border-default-200 px-3 py-4 odd:border-r sm:border-r sm:last:border-r-0"
            >
              <SkeletonLine className="h-4 w-20" />
              <SkeletonLine className="mt-3 h-7 w-8" />
              <SkeletonLine className="mt-2 h-3 w-24 max-w-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
