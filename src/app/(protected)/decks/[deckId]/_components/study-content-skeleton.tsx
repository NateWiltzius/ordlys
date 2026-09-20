import DeckProgressSkeleton from '@/app/(protected)/decks/[deckId]/_components/deck-progress-skeleton';
import { SkeletonBlock, SkeletonLine, StudyActionCardSkeleton } from '@/components/shared/skeleton';

export function StudyContentSkeleton() {
  return (
    <div
      className="space-y-6"
      role="status"
      aria-label="Loading study information"
      aria-busy="true"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <StudyActionCardSkeleton />
        <StudyActionCardSkeleton />
      </div>
      <DeckProgressSkeleton />
      <div className="flex items-center justify-between gap-4 rounded-xl border border-default-200 bg-default-50/50 p-4 sm:p-5">
        <div className="min-w-0 flex-1 space-y-1">
          <SkeletonLine className="h-5 w-36" />
          <SkeletonLine className="h-6 w-64 max-w-full" />
        </div>
        <SkeletonBlock className="size-5 shrink-0 rounded" />
      </div>
    </div>
  );
}
