import DashboardDeckCard from '@/components/deck/dashboard-deck-card';
import PageHeader from '@/components/shared/layout/page-header';
import { getAllDecksStudyCountsAction, getUserSubscribedDecksAction } from '@/server/deck.actions';
import { Button, Card } from '@heroui/react';
import Link from 'next/link';

export default async function DashboardPage() {
  const allDeckStats = await getAllDecksStudyCountsAction();
  const activeDecks = await getUserSubscribedDecksAction();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Track your active decks, due reviews, and learning progress."
        actions={
          <Link href="/decks">
            <Button variant="secondary">Browse decks</Button>
          </Link>
        }
      />

      <Card>
        <Card.Header>
          <Card.Title>Study summary</Card.Title>
          <Card.Description>Your progress across all active decks.</Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Total words" value={allDeckStats.totalWords} />
            <Stat label="New words available" value={allDeckStats.newWordsAvailable} />
            <Stat label="Reviews due" value={allDeckStats.reviewsDue} />
            <Stat label="Words in review" value={allDeckStats.wordsInReview} />
          </div>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Card.Title>Active decks</Card.Title>
            <Card.Description>
              Continue learning or review due cards from each deck.
            </Card.Description>
          </div>

          <p className="text-sm text-default-500">
            {activeDecks.length} {activeDecks.length === 1 ? 'deck' : 'decks'}
          </p>
        </Card.Header>

        <Card.Content>
          {activeDecks.length === 0 ? (
            <div className="rounded-lg bg-default-100 px-4 py-6 text-center">
              <p className="font-medium">No active decks yet</p>
              <p className="mt-1 text-sm text-default-500">
                Browse public decks or create your own to start learning.
              </p>
              <Link href="/decks" className="mt-4 inline-flex">
                <Button variant="primary">Browse decks</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {activeDecks.map(deck => (
                <DashboardDeckCard key={deck.id} deck={deck} />
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
