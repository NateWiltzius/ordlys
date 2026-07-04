import { getDeckById } from '@/db/queries/deck.queries';
import { getLessonsByDeckId } from '@/db/queries/lesson.queries';
import { createClient } from '@/lib/supabase/server';
import PageHeader from '@/components/shared/layout/page-header';
import { getDeckStudyCountsAction, getUserSubscribedDecksAction } from '@/server/deck.actions';
import { Button, Card, Chip } from '@heroui/react';
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
  console.log(counts);
  const subscribedDecks = await getUserSubscribedDecksAction();

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  const currentUserId = data.user?.id;
  const isOwned = Boolean(currentUserId && deck.ownerId === currentUserId);
  const isSubscribed = subscribedDecks.some(subscribedDeck => subscribedDeck.id === deck.id);
  const canStudy = isOwned || isSubscribed;

  return (
    <div className="space-y-6">
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
          isOwned ? (
            <Link href={`/decks/${deck.id}/edit`}>
              <Button variant="secondary">Edit deck</Button>
            </Link>
          ) : null
        }
      >
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
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2">
        <Card variant="tertiary" className="h-full">
          <Card.Header>
            <Card.Title>Learn new words</Card.Title>
            <Card.Description>
              Add new vocabulary from this deck into your active review queue.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <p className="text-3xl font-semibold">{counts.newWordsAvailable}</p>
            <p className="text-sm text-default-500">new words available</p>
          </Card.Content>
          <Card.Footer>
            {canStudy ? (
              <Link href={`/decks/${deck.id}/learn`} className="w-full">
                <Button variant="primary" className="w-full">
                  Start learning
                </Button>
              </Link>
            ) : (
              <Button variant="primary" className="w-full">
                Start learning this deck
              </Button>
            )}
          </Card.Footer>
        </Card>

        <Card variant="secondary" className="h-full">
          <Card.Header>
            <Card.Title>Review due cards</Card.Title>
            <Card.Description>
              Practice words that are ready for review and keep your memory fresh.
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <p className="text-3xl font-semibold">{counts.reviewsDue}</p>
            <p className="text-sm text-default-500">reviews due</p>
          </Card.Content>
          <Card.Footer>
            <Link href={`/decks/${deck.id}/review`} className="w-full">
              <Button variant="secondary" className="w-full" isDisabled={!canStudy}>
                Review now
              </Button>
            </Link>
          </Card.Footer>
        </Card>
      </div>

      <Card>
        <Card.Header>
          <Card.Title>Study summary</Card.Title>
          <Card.Description>Your progress in this deck.</Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Total words" value={counts.totalWords} />
            <Stat label="New words available" value={counts.newWordsAvailable} />
            <Stat label="Reviews due" value={counts.reviewsDue} />
            <Stat label="Words in review" value={counts.wordsInReview} />
          </div>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>Lessons</Card.Title>
          <Card.Description>The lessons included in this deck.</Card.Description>
        </Card.Header>
        <Card.Content>
          {lessons.length === 0 ? (
            <p className="text-sm text-default-500">No lessons yet.</p>
          ) : (
            <div className="divide-y divide-default-200">
              {lessons.map(lesson => (
                <div key={lesson.id} className="py-3 text-sm font-medium">
                  {lesson.title}
                </div>
              ))}
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-default-100 px-3 py-2">
      <p className="text-sm text-default-500">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
