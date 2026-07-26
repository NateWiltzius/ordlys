import { getCachedLessonProgress } from '@/app/(protected)/decks/[deckId]/_lib/get-cached-lesson-progress';
import { getCachedDeckStudyData } from '@/app/(protected)/decks/[deckId]/_lib/get-cached-deck-study-data';
import DeckProgressMarker from '@/app/(protected)/decks/[deckId]/_components/deck-progress-marker';
import { Deck } from '@/types/deck.types';
import { Button } from '@heroui/react';
import FollowDeckButton from '@/app/(protected)/decks/[deckId]/_components/follow-deck-button';
import { ClockIcon, SparklesIcon } from '@heroicons/react/24/outline';
import StudyActionCard from '@/app/(protected)/decks/[deckId]/_components/study-action-card';
import NextReviewText from '@/components/shared/next-review-text';
import ButtonLink from '@/components/shared/button-link';
import ReviewForecastCard from '@/components/shared/review-forecast-card';

type Props = {
  deck: Deck;
  isOwned: boolean;
  autoFollow?: boolean;
};

export default async function DeckStudyContent({ deck, isOwned, autoFollow = false }: Props) {
  const [studyData, lessonProgress] = await Promise.all([
    getCachedDeckStudyData(deck.id),
    getCachedLessonProgress(deck.id),
  ]);
  const { counts, canStudy, nextReview, reviewForecast } = studyData;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <StudyActionCard
          title="Review due cards"
          description={
            counts.reviewsDue === 0 && canStudy ? (
              <NextReviewText nextReview={nextReview} />
            ) : (
              'Practice cards that are ready for review and keep your memory fresh.'
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
          title="Learn new cards"
          description="Learn new material now and review it again at the right time."
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
                No cards to learn
              </Button>
            ) : isOwned && !deck.currentReleaseId && deck.status === 'active' ? (
              <ButtonLink
                href={`/decks/${deck.id}/edit?tab=publishing`}
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
              <FollowDeckButton deckId={deck.id} autoFollow={autoFollow} />
            )
          }
        />
      </div>

      {canStudy ? <DeckProgressMarker lessonProgress={lessonProgress} /> : null}

      {canStudy ? (
        <ReviewForecastCard
          forecast={reviewForecast}
          nextReview={nextReview}
          title="Review schedule"
          description="Reviews from this deck over the next 24 hours."
          collapsible
        />
      ) : null}
    </div>
  );
}
