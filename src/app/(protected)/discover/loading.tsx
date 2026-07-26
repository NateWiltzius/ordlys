import {
  DeckCardSkeleton,
  DeckDiscoveryControlsSkeleton,
  PageHeaderSkeleton,
} from '@/components/shared/skeleton';

export default function DiscoverLoading({ showHeader = true }: { showHeader?: boolean }) {
  return (
    <div className="space-y-6" role="status" aria-label="Loading discover" aria-busy="true">
      <span className="sr-only">Loading discover…</span>
      {showHeader ? <PageHeaderSkeleton actionCount={0} descriptionLines={2} /> : null}
      <div className="space-y-4">
        <DeckDiscoveryControlsSkeleton />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <DeckCardSkeleton key={index} showMeta />
          ))}
        </div>
      </div>
    </div>
  );
}
