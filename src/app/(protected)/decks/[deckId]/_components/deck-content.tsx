import DeckHeader from '@/app/(protected)/decks/[deckId]/_components/deck-header';
import DeckLessons from '@/app/(protected)/decks/[deckId]/_components/deck-lessons';
import DeckStudyContent from '@/app/(protected)/decks/[deckId]/_components/deck-study-content';
import LessonsSkeleton from '@/app/(protected)/decks/[deckId]/_components/lessons-skeleton';
import { StudyContentSkeleton } from '@/app/(protected)/decks/[deckId]/_components/study-content-skeleton';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getLanguageName } from '@/lib/languages';
import { getCachedDeckPageIdentity } from '@/app/(protected)/decks/[deckId]/_lib/get-cached-deck-page-data';

type Props = {
  deckId: number;
  autoFollow?: boolean;
};

export default async function DeckContent({ deckId, autoFollow = false }: Props) {
  const identity = await getCachedDeckPageIdentity(deckId);
  if (!identity) notFound();
  const { deck, isOwned, isFollowing } = identity;

  return (
    <div className="space-y-6">
      <DeckHeader deck={deck} isOwned={isOwned} isFollowing={isFollowing} />

      <Suspense fallback={<StudyContentSkeleton />}>
        <DeckStudyContent deck={deck} isOwned={isOwned} autoFollow={autoFollow} />
      </Suspense>

      <Suspense fallback={<LessonsSkeleton />}>
        <DeckLessons
          deckId={deck.id}
          frontLabel={getLanguageName(deck.frontLanguage) ?? 'Front'}
          backLabel={getLanguageName(deck.backLanguage) ?? 'Back'}
        />
      </Suspense>
    </div>
  );
}
