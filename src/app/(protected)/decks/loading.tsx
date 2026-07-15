import {
  DeckCardSkeleton,
  DeckDiscoveryControlsSkeleton,
  PageHeaderSkeleton,
  SkeletonBlock,
} from '@/components/shared/skeleton';

export default function DecksLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading library" aria-busy="true">
      <span className="sr-only">Loading library…</span>
      <PageHeaderSkeleton actionCount={2} />
      <div className="w-full">
        <div className="grid w-full grid-cols-2 gap-2">
          <SkeletonBlock className="h-10 w-full rounded-lg" />
          <SkeletonBlock className="h-10 w-full rounded-lg" />
        </div>
        <div className="space-y-4 pt-4">
          <DeckDiscoveryControlsSkeleton />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <DeckCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
