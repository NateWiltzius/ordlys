import {
  DeckDiscoveryControlsSkeleton,
  PublicDeckCardSkeleton,
  SkeletonBlock,
  SkeletonLine,
} from '@/components/shared/skeleton';

export default function PublicDecksLoading() {
  return (
    <section className="space-y-4" role="status" aria-label="Loading public decks" aria-busy="true">
      <span className="sr-only">Loading public decks…</span>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <SkeletonLine className="h-6 w-40" />
          <SkeletonLine className="h-4 w-full max-w-2xl" />
        </div>
        <SkeletonBlock className="h-8 w-36 rounded-lg" />
      </div>
      <DeckDiscoveryControlsSkeleton />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <PublicDeckCardSkeleton key={index} />
        ))}
      </div>
    </section>
  );
}
