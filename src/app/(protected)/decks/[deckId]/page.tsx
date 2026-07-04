import DeckHeader from '@/app/(protected)/decks/[deckId]/_components/deck-header';
import DeckLessons from '@/app/(protected)/decks/[deckId]/_components/deck-lessons';
import LessonsSkeleton from '@/app/(protected)/decks/[deckId]/_components/lessons-skeleton';
import { StudyContentSkeleton } from '@/app/(protected)/decks/[deckId]/_components/study-content-skeleton';
import DeckStudyContent from '@/app/(protected)/decks/[deckId]/_components/deck-study-content';
import { getAccessibleDeckById } from '@/db/queries/deck.queries';
import { getCurrentUserId } from '@/lib/auth/get-current-user-id';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { hasDeckSubscription } from '@/db/queries/deck-subscription.queries';
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
  const [deck, isSubscribed] = await Promise.all([
    getAccessibleDeckById(parsedDeckId, currentUserId),
    hasDeckSubscription(parsedDeckId, currentUserId),
  ]);
  if (!deck) notFound();

  const isOwned = deck.ownerId === currentUserId;
  const canStudy = isSubscribed;

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
