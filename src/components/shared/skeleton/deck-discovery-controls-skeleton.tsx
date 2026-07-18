import SkeletonBlock from '@/components/shared/skeleton/skeleton-block';
import SkeletonLine from '@/components/shared/skeleton/skeleton-line';

export default function DeckDiscoveryControlsSkeleton() {
  return (
    <div className="space-y-2">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_14rem]">
        <div className="space-y-2">
          <SkeletonLine className="h-4 w-24" />
          <SkeletonBlock className="h-10 w-full rounded-lg" />
        </div>
        <div className="space-y-2">
          <SkeletonLine className="h-4 w-16" />
          <SkeletonBlock className="h-10 w-full rounded-lg" />
        </div>
      </div>
      <SkeletonLine className="h-4 w-36" />
    </div>
  );
}
