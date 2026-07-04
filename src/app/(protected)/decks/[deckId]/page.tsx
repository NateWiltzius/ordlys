import DeckHeader from '@/app/(protected)/decks/[deckId]/_components/deck-header';
import DeckLessons from '@/app/(protected)/decks/[deckId]/_components/deck-lessons';
import LessonsSkeleton from '@/app/(protected)/decks/[deckId]/_components/lessons-skeleton';
import { StudyContentSkeleton } from '@/app/(protected)/decks/[deckId]/_components/study-content-skeleton';
import DeckStudyContent from '@/app/(protected)/decks/[deckId]/_components/deck-study-content';
import { getAccessibleDeckById } from '@/db/queries/deck.queries';
import { getCurrentUserId } from '@/lib/auth/get-current-user-id';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { getUserSubscribedDecksAction } from '@/server/deck.actions';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

type Props = {
  params: Promise<{
    deckId: string;
  }>;
};

export default async function DeckPage({ params }: Props) {
  const { deckId } = await params;
  const parsedDeckId = parsePositiveInteger(deckId);
  if (!parsedDeckId) notFound();

  const currentUserId = await getCurrentUserId();
  const [deck, subscribedDecks] = await Promise.all([
    getAccessibleDeckById(parsedDeckId, currentUserId),
    getUserSubscribedDecksAction(),
  ]);
  if (!deck) notFound();

  const isOwned = deck.ownerId === currentUserId;
  const isSubscribed = subscribedDecks.some(subscribedDeck => subscribedDeck.id === deck.id);
  const canStudy = isOwned || isSubscribed;

  return (
    <div className="space-y-6">
      <DeckHeader deck={deck} isOwned={isOwned} isSubscribed={isSubscribed} />

      <Suspense fallback={<StudyContentSkeleton />}>
        <DeckStudyContent deck={deck} userId={currentUserId} canStudy={canStudy} />
      </Suspense>

      <Suspense fallback={<LessonsSkeleton />}>
        <DeckLessons deckId={deck.id} userId={currentUserId} canStudy={canStudy} />
      </Suspense>
    </div>
  );
}
