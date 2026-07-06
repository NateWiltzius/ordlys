import DeckHeader from '@/app/(protected)/decks/[deckId]/_components/deck-header';
import DeckLessons from '@/app/(protected)/decks/[deckId]/_components/deck-lessons';
import LessonsSkeleton from '@/app/(protected)/decks/[deckId]/_components/lessons-skeleton';
import { StudyContentSkeleton } from '@/app/(protected)/decks/[deckId]/_components/study-content-skeleton';
import DeckStudyContent from '@/app/(protected)/decks/[deckId]/_components/deck-study-content';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getDeckPageDataAction } from '@/server/deck.actions';
import ReviewForecastCard from '@/components/shared/review-forecast-card';
import type { Metadata } from 'next';
import DeckLoading from '@/app/(protected)/decks/[deckId]/loading';

export const metadata: Metadata = {
  title: 'Deck',
  description: 'Study vocabulary, review progress, and browse deck lessons.',
};

type Props = {
  params: Promise<{
    deckId: string;
  }>;
};

export default async function DeckPage({ params }: Props) {
  const { deckId } = await params;
  const parsedDeckId = parsePositiveInteger(deckId);
  if (!parsedDeckId) notFound();

  return (
    <Suspense fallback={<DeckLoading />}>
      <DeckContent deckId={parsedDeckId} />
    </Suspense>
  );
}

async function DeckContent({ deckId }: { deckId: number }) {
  const data = await getDeckPageDataAction(deckId);
  if (!data) notFound();
  const { deck, isOwned, isSubscribed, canStudy, reviewForecast, nextReview } = data;

  return (
    <div className="space-y-6">
      <DeckHeader deck={deck} isOwned={isOwned} isSubscribed={isSubscribed} />

      <Suspense fallback={<StudyContentSkeleton />}>
        <DeckStudyContent deck={deck} canStudy={canStudy} nextReview={nextReview} />
      </Suspense>

      <ReviewForecastCard
        forecast={reviewForecast}
        nextReview={nextReview}
        description="Reviews from this deck scheduled over the next 24 hours."
      />

      <Suspense fallback={<LessonsSkeleton />}>
        <DeckLessons deckId={deck.id} canStudy={canStudy} />
      </Suspense>
    </div>
  );
}
