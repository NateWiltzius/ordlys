import DeckHeader from '@/app/(protected)/decks/[deckId]/_components/deck-header';
import DeckLessons from '@/app/(protected)/decks/[deckId]/_components/deck-lessons';
import LessonsSkeleton from '@/app/(protected)/decks/[deckId]/_components/lessons-skeleton';
import { StudyContentSkeleton } from '@/app/(protected)/decks/[deckId]/_components/study-content-skeleton';
import DeckStudyContent from '@/app/(protected)/decks/[deckId]/_components/deck-study-content';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getDeckPageDataAction } from '@/server/deck.actions';
import type { Metadata } from 'next';
import DeckLoading from '@/app/(protected)/decks/[deckId]/loading';
import DeckWorkspaceNavigation from '@/app/(protected)/decks/[deckId]/_components/deck-workspace-navigation';

export const metadata: Metadata = {
  title: 'Deck',
  description: 'Study vocabulary, review progress, and browse deck lessons.',
};

type Props = {
  params: Promise<{
    deckId: string;
  }>;
};

type DeckContentProps = {
  deckId: number;
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

async function DeckContent({ deckId }: DeckContentProps) {
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

      <DeckWorkspaceNavigation
        deckId={deck.id}
        activeSection="overview"
        showOwnerSections={isOwned && deck.status === 'active'}
      />

      <Suspense fallback={<StudyContentSkeleton />}>
        <DeckStudyContent
          deck={deck}
          canStudy={canStudy}
          isOwned={isOwned}
          nextReview={nextReview}
          reviewForecast={reviewForecast}
        />
      </Suspense>

      <Suspense fallback={<LessonsSkeleton />}>
        <DeckLessons deckId={deck.id} canStudy={canStudy} />
      </Suspense>
    </div>
  );
}
