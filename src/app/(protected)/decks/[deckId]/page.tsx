import DeckHeader from '@/app/(protected)/decks/[deckId]/_components/deck-header';
import DeckLessons from '@/app/(protected)/decks/[deckId]/_components/deck-lessons';
import LessonsSkeleton from '@/app/(protected)/decks/[deckId]/_components/lessons-skeleton';
import { StudyContentSkeleton } from '@/app/(protected)/decks/[deckId]/_components/study-content-skeleton';
import DeckStudyContent from '@/app/(protected)/decks/[deckId]/_components/deck-study-content';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getDeckPageDataAction } from '@/server/deck.actions';

type Props = {
  params: Promise<{
    deckId: string;
  }>;
};

export default async function DeckPage({ params }: Props) {
  const { deckId } = await params;
  const parsedDeckId = parsePositiveInteger(deckId);
  if (!parsedDeckId) notFound();

  const data = await getDeckPageDataAction(parsedDeckId);
  if (!data) notFound();
  const { deck, isOwned, isSubscribed, canStudy } = data;

  return (
    <div className="space-y-6">
      <DeckHeader deck={deck} isOwned={isOwned} isSubscribed={isSubscribed} />

      <Suspense fallback={<StudyContentSkeleton />}>
        <DeckStudyContent deck={deck} canStudy={canStudy} />
      </Suspense>

      <Suspense fallback={<LessonsSkeleton />}>
        <DeckLessons deckId={deck.id} canStudy={canStudy} />
      </Suspense>
    </div>
  );
}
