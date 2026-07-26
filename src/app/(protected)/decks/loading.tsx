import {
  DeckCardSkeleton,
  DeckDiscoveryControlsSkeleton,
  PageHeaderSkeleton,
  SkeletonBlock,
} from '@/components/shared/skeleton';

export default function DecksLoading({ showHeader = true }: { showHeader?: boolean }) {
  return (
    <div className="space-y-6" role="status" aria-label="Loading library" aria-busy="true">
      <span className="sr-only">Loading library…</span>
      {showHeader ? <PageHeaderSkeleton actionCount={2} /> : null}
      <div className="w-full">
        <div className="grid w-full grid-cols-2 gap-2 sm:max-w-md">
          <SkeletonBlock className="h-10 w-full rounded-lg" />
          <SkeletonBlock className="h-10 w-full rounded-lg" />
        </div>
        <div className="pt-4">
          <DeckDiscoveryControlsSkeleton compact />
          <div className="divide-y divide-default-200 border-b border-default-200">
            {Array.from({ length: 3 }, (_, index) => (
              <DeckCardSkeleton key={index} layout="row" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
