import SkeletonBlock from '@/components/shared/skeleton/skeleton-block';
import SkeletonLine from '@/components/shared/skeleton/skeleton-line';

type Props = {
  compact?: boolean;
};

export default function DeckDiscoveryControlsSkeleton({ compact = false }: Props) {
  if (compact) {
    return (
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-default-200 pb-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto]">
        <SkeletonBlock className="col-span-2 h-10 w-full rounded-lg sm:col-span-1" />
        <SkeletonBlock className="h-10 w-full rounded-lg" />
        <SkeletonLine className="h-4 w-12 sm:ml-auto" />
      </div>
    );
  }

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
