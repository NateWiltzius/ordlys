import PageHeader from '@/components/shared/layout/page-header';
import { Card } from '@heroui/react';
import ButtonLink from '@/components/shared/button-link';
import StudySummary from '@/components/shared/study-summary';
import EmptyState from '@/components/shared/empty-state';
import DashboardDeckRow from '@/app/_components/dashboard/dashboard-deck-row';
import { getDashboardDataAction } from '@/server/deck.actions';

export default async function DashboardContent() {
  const { activeDecks, allDeckStats, deckStats } = await getDashboardDataAction();

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
            <div className="-mx-6 divide-y divide-default-200">
              {activeDecks.map(deck => (
                <DashboardDeckRow
                  key={deck.id}
                  deck={deck}
                  stats={deckStats[deck.id] ?? { totalWords: 0, reviewsDue: 0 }}
                />
              ))}
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
