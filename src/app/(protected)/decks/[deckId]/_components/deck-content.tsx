import DeckHeader from '@/app/(protected)/decks/[deckId]/_components/deck-header';
import DeckLessons from '@/app/(protected)/decks/[deckId]/_components/deck-lessons';
import DeckStudyContent from '@/app/(protected)/decks/[deckId]/_components/deck-study-content';
import LessonsSkeleton from '@/app/(protected)/decks/[deckId]/_components/lessons-skeleton';
import { StudyContentSkeleton } from '@/app/(protected)/decks/[deckId]/_components/study-content-skeleton';
import { getDeckPageDataAction } from '@/server/deck.actions';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getLanguageName } from '@/lib/languages';

type Props = {
  deckId: number;
  autoFollow?: boolean;
};

export default async function DeckContent({ deckId, autoFollow = false }: Props) {
  const data = await getDeckPageDataAction(deckId);
  if (!data) notFound();
  const {
    deck,
    isOwned,
    isFollowing,
    canStudy,
    reviewForecast,
    nextReview,
    followState,
    releases,
    releaseChanges,
    canModerate,
    protectedFollowerCount,
  } = data;

  return (
    <div className="space-y-6">
      <DeckHeader
        deck={deck}
        isOwned={isOwned}
        isFollowing={isFollowing}
        followState={followState}
        releases={releases}
        releaseChanges={releaseChanges}
        canModerate={canModerate}
        protectedFollowerCount={protectedFollowerCount}
      />

      <Suspense fallback={<StudyContentSkeleton />}>
        <DeckStudyContent
          deck={deck}
          canStudy={canStudy}
          isOwned={isOwned}
          nextReview={nextReview}
          reviewForecast={reviewForecast}
          autoFollow={autoFollow}
        />
      </Suspense>

      <Suspense fallback={<LessonsSkeleton />}>
        <DeckLessons
          deckId={deck.id}
          canStudy={canStudy}
          frontLabel={getLanguageName(deck.frontLanguage) ?? 'Front'}
          backLabel={getLanguageName(deck.backLanguage) ?? 'Back'}
        />
      </Suspense>
    </div>
  );
}
