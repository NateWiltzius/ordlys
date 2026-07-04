import DashboardDeckCard from '@/components/deck/dashboard-deck-card';
import PageHeader from '@/components/shared/layout/page-header';
import { getAllDecksStudyCountsAction, getUserActiveDecksAction } from '@/server/deck.actions';
import { Card } from '@heroui/react';
import ButtonLink from '@/components/shared/button-link';
import StudySummary from '@/components/shared/study-summary';
import EmptyState from '@/components/shared/empty-state';

export default async function DashboardPage() {
  const allDeckStats = await getAllDecksStudyCountsAction();
  const activeDecks = await getUserActiveDecksAction();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Track your active decks, due reviews, and learning progress."
        actions={
          <ButtonLink href="/decks" variant="secondary">
            Browse decks
          </ButtonLink>
        }
      />

      <StudySummary counts={allDeckStats} description="Your progress across all active decks." />

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
            <EmptyState
              title="No active decks yet"
              description="Browse public decks or create your own to start learning."
              action={<ButtonLink href="/decks">Browse decks</ButtonLink>}
            />
          ) : (
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
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
