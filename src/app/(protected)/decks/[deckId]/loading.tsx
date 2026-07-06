import { PageHeaderSkeleton, ReviewForecastSkeleton } from '@/components/shared/skeleton';
import LessonsSkeleton from '@/app/(protected)/decks/[deckId]/_components/lessons-skeleton';
import { StudyContentSkeleton } from '@/app/(protected)/decks/[deckId]/_components/study-content-skeleton';

export default function DeckLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading deck" aria-busy="true">
      <span className="sr-only">Loading deck…</span>
      <PageHeaderSkeleton actionCount={1} badgeCount={2} />
      <StudyContentSkeleton />
      <ReviewForecastSkeleton />
      <LessonsSkeleton />
    </div>
  );
}
