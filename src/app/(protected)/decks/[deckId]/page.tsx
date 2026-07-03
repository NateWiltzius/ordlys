import { getDeckById } from '@/db/queries/deck.queries';
import { getLessonsByDeckId } from '@/db/queries/lesson.queries';
import { createClient } from '@/lib/supabase/server';
import PageHeader from '@/components/shared/layout/page-header';
import { getDeckStudyCountsAction, getUserSubscribedDecksAction } from '@/server/deck.actions';
import { Button, Chip } from '@heroui/react';
import Link from 'next/link';

type Props = {
  params: Promise<{
    deckId: string;
  }>;
};

export default async function DeckPage({ params }: Props) {
  const { deckId } = await params;
  const parsedDeckId = Number(deckId);
  const deck = await getDeckById(parsedDeckId);

  if (!deck) {
    return <div>Deck not found</div>;
  }

  const lessons = await getLessonsByDeckId(parsedDeckId);
  const counts = await getDeckStudyCountsAction(parsedDeckId);
  const subscribedDecks = await getUserSubscribedDecksAction();
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const currentUserId = data.user?.id;
  const isOwned = Boolean(currentUserId && deck.ownerId === currentUserId);
  const isSubscribed = subscribedDecks.some(subscribedDeck => subscribedDeck.id === deck.id);

  return (
    <>
      <PageHeader
        title={deck.title}
        description={
          isOwned
            ? 'You manage this deck and can edit its lessons and vocabulary.'
            : isSubscribed
              ? 'You are currently learning this deck. Review due cards and keep going.'
              : 'This is a public deck. Start learning it to add it to your active study list.'
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {isSubscribed || isOwned ? (
              <>
                <Link href={`/decks/${deck.id}/learn`}>
                  <Button variant="primary">Continue learning</Button>
                </Link>
                <Link href={`/decks/${deck.id}/review`}>
                  <Button variant="secondary">Review now</Button>
                </Link>
              </>
            ) : (
              <Button variant="primary">Start learning</Button>
            )}
            {isOwned ? (
              <Link href={`/decks/${deck.id}/edit`}>
                <Button variant="secondary">Edit deck</Button>
              </Link>
            ) : (
              <Link href={`/decks/${deck.id}`}>
                <Button variant="secondary">View deck</Button>
              </Link>
            )}
          </div>
        }
      />
      <div className="flex flex-wrap gap-2">
        {isOwned ? (
          <Chip color="warning" size="sm">
            You own this deck
          </Chip>
        ) : isSubscribed ? (
          <Chip color="success" size="sm">
            You are learning this deck
          </Chip>
        ) : (
          <Chip size="sm">Public deck</Chip>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <h2 className="text-lg font-medium">Study Counts</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-md border border-default-200 px-3 py-2">
            <p className="text-sm text-default-500">Total Words</p>
            <p className="text-lg font-semibold">{counts.totalWords}</p>
          </div>
          <div className="rounded-md border border-default-200 px-3 py-2">
            <p className="text-sm text-default-500">New Words Available</p>
            <p className="text-lg font-semibold">{counts.newWordsAvailable}</p>
          </div>
          <div className="rounded-md border border-default-200 px-3 py-2">
            <p className="text-sm text-default-500">Reviews Due</p>
            <p className="text-lg font-semibold">{counts.reviewsDue}</p>
          </div>
          <div className="rounded-md border border-default-200 px-3 py-2">
            <p className="text-sm text-default-500">Words in Review</p>
            <p className="text-lg font-semibold">{counts.wordsInReview}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-medium">Lessons</h2>
        {lessons.length === 0 ? (
          <p className="text-default-500">No lessons yet. Create your first lesson.</p>
        ) : (
          lessons.map(lesson => (
            <div key={lesson.id} className="rounded-md border border-default-200 px-3 py-2">
              {lesson.title}
            </div>
          ))
        )}
      </div>
    </>
  );
}
