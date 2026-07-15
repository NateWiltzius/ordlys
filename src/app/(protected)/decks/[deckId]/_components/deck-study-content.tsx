import { getCachedLessonProgress } from '@/app/(protected)/decks/[deckId]/_lib/get-cached-lesson-progress';
import DeckProgressMarker from '@/app/(protected)/decks/[deckId]/_components/deck-progress-marker';
import StudySummary from '@/components/shared/study-summary';
import { getDeckStudyCountsAction } from '@/server/deck.actions';
import { Deck } from '@/types/deck.types';
import { Button } from '@heroui/react';
import FollowDeckButton from '@/app/(protected)/decks/[deckId]/_components/follow-deck-button';
import { ClockIcon, SparklesIcon } from '@heroicons/react/24/outline';
import StudyActionCard from '@/app/(protected)/decks/[deckId]/_components/study-action-card';
import NextReviewText from '@/components/shared/next-review-text';
import type { NextReviewBatch } from '@/types/review.types';
import ButtonLink from '@/components/shared/button-link';
import ReviewForecastCard from '@/components/shared/review-forecast-card';
import type { ReviewForecast } from '@/types/review.types';

type Props = {
  deck: Deck;
  canStudy: boolean;
  isOwned: boolean;
  nextReview: NextReviewBatch | null;
  reviewForecast: ReviewForecast;
};

export default async function DeckStudyContent({
  deck,
  canStudy,
  isOwned,
  nextReview,
  reviewForecast,
}: Props) {
  const [counts, lessonProgress] = await Promise.all([
    getDeckStudyCountsAction(deck.id),
    getCachedLessonProgress(deck.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <StudyActionCard
          title="Review due cards"
          description={
            counts.reviewsDue === 0 && canStudy ? (
              <NextReviewText nextReview={nextReview} />
            ) : (
              'Practice words that are ready for review and keep your memory fresh.'
            )
          }
          count={counts.reviewsDue}
          countLabel="reviews due"
          actionLabel="Review now"
          icon={ClockIcon}
          tone="review"
          href={canStudy && counts.reviewsDue > 0 ? `/decks/${deck.id}/review` : undefined}
          isDisabled={!canStudy || counts.reviewsDue === 0}
          unavailableAction={
            <Button variant="secondary" size="lg" className="w-full" isDisabled>
              {canStudy ? 'No reviews due' : 'Review now'}
            </Button>
          }
        />

        <StudyActionCard
          title="Learn new words"
          description="Add new vocabulary from this deck into your active review queue."
          count={counts.newWordsAvailable}
          countLabel="ready to learn"
          actionLabel="Start learning"
          icon={SparklesIcon}
          tone="learning"
          href={canStudy && counts.newWordsAvailable > 0 ? `/decks/${deck.id}/learn` : undefined}
          isDisabled={canStudy && counts.newWordsAvailable === 0}
          unavailableAction={
            canStudy ? (
              <Button variant="secondary" size="lg" className="w-full" isDisabled>
                No words to learn
              </Button>
            ) : isOwned && !deck.currentReleaseId && deck.status === 'active' ? (
              <ButtonLink
                href={`/decks/${deck.id}/edit?section=publishing`}
                variant="secondary"
                size="lg"
                className="w-full"
              >
                Publish deck to start learning
              </ButtonLink>
            ) : isOwned && deck.status !== 'active' ? (
              <Button variant="secondary" size="lg" className="w-full" isDisabled>
                Restore deck to start learning
              </Button>
            ) : (
              <FollowDeckButton deckId={deck.id} />
            )
          }
        />
      </div>

      {canStudy ? <DeckProgressMarker lessonProgress={lessonProgress} /> : null}

      <ReviewForecastCard
        forecast={reviewForecast}
        nextReview={nextReview}
        description="Reviews from this deck scheduled over the next 24 hours."
      />

      <StudySummary counts={counts} description="Your progress in this deck." />
    </div>
  );
}
