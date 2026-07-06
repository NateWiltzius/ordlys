import { DeckCardSkeleton, PageHeaderSkeleton, SkeletonBlock } from '@/components/shared/skeleton';

export default function DecksLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading decks" aria-busy="true">
      <span className="sr-only">Loading decks…</span>
      <PageHeaderSkeleton actionCount={2} />
      <div className="w-full">
        <div className="max-w-full overflow-x-auto">
          <div className="flex min-w-max gap-2">
            <SkeletonBlock className="h-10 w-28 rounded-lg" />
            <SkeletonBlock className="h-10 w-24 rounded-lg" />
          </div>
        </div>
        <div className="grid gap-4 pt-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <DeckCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
