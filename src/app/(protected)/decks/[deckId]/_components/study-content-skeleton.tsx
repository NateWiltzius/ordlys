import DeckProgressSkeleton from '@/app/(protected)/decks/[deckId]/_components/deck-progress-skeleton';
import {
  ReviewForecastSkeleton,
  StudyActionCardSkeleton,
  StudySummarySkeleton,
} from '@/components/shared/skeleton';

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
      <ReviewForecastSkeleton />
      <StudySummarySkeleton />
    </div>
  );
}
