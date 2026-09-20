import { PageHeaderSkeleton, SkeletonBlock } from '@/components/shared/skeleton';
import { StudyContentSkeleton } from '@/app/(protected)/decks/[deckId]/_components/study-content-skeleton';

export default function DeckLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading deck" aria-busy="true">
      <span className="sr-only">Loading deck…</span>
      <PageHeaderSkeleton actionCount={1} />
      <div className="space-y-4">
        <SkeletonBlock className="h-10 w-full rounded-xl sm:max-w-md" />
        <StudyContentSkeleton />
      </div>
    </div>
  );
}
