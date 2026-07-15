import { DeckCardSkeleton, PageHeaderSkeleton } from '@/components/shared/skeleton';

export default function DiscoverLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading discover" aria-busy="true">
      <span className="sr-only">Loading discover…</span>
      <PageHeaderSkeleton />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <DeckCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
