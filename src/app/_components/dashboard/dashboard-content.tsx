import PageHeader from '@/components/shared/layout/page-header';
import { Card } from '@heroui/react';
import ButtonLink from '@/components/shared/button-link';
import EmptyState from '@/components/shared/empty-state';
import DashboardDeckRow from '@/app/_components/dashboard/dashboard-deck-row';
import { getDashboardDataAction } from '@/server/deck.actions';
import ReviewForecastCard from '@/components/shared/review-forecast-card';
import DashboardReviewCard from '@/app/_components/dashboard/dashboard-review-card';
import DashboardRecentMistakesCard from '@/app/_components/dashboard/dashboard-recent-mistakes-card';
import { getRecentMistakeCountAction } from '@/server/review.actions';
import DashboardSrsCard from '@/app/_components/dashboard/dashboard-srs-card';
import DashboardLearningCard from '@/app/_components/dashboard/dashboard-learning-card';

export default async function DashboardContent() {
  const [dashboardData, recentMistakeCount] = await Promise.all([
    getDashboardDataAction(),
    getRecentMistakeCountAction(),
  ]);
  const { activeDecks, allDeckStats, deckStats, reviewForecast, nextReview, srsCategoryCounts } =
    dashboardData;
  const deckShortcuts = [...activeDecks]
    .sort((first, second) => {
      const firstStats = deckStats[first.id];
      const secondStats = deckStats[second.id];
      const reviewDifference = (secondStats?.reviewsDue ?? 0) - (firstStats?.reviewsDue ?? 0);

      if (reviewDifference !== 0) return reviewDifference;
      return (secondStats?.newWordsAvailable ?? 0) - (firstStats?.newWordsAvailable ?? 0);
    })
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Today"
        description="Start what is ready now and keep your learning moving."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DashboardReviewCard
          decks={activeDecks}
          deckStats={deckStats}
          reviewsDue={allDeckStats.reviewsDue}
        />

        <DashboardLearningCard
          decks={activeDecks}
          deckStats={deckStats}
          newWordsAvailable={allDeckStats.newWordsAvailable}
        />

        <div className="h-full md:col-span-2 xl:col-span-1">
          <DashboardRecentMistakesCard count={recentMistakeCount} />
        </div>
      </div>

      <ReviewForecastCard forecast={reviewForecast} nextReview={nextReview} />

      <DashboardSrsCard counts={srsCategoryCounts} />

      <Card>
        <Card.Header className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="card__title">Deck shortcuts</h2>
            <Card.Description>
              Your most relevant decks based on reviews and new words available.
            </Card.Description>
          </div>

          {activeDecks.length > 0 ? (
            <ButtonLink href="/decks" variant="tertiary" size="sm">
              View library
            </ButtonLink>
          ) : null}
        </Card.Header>

        <Card.Content>
          {activeDecks.length === 0 ? (
            <EmptyState
              title="No active decks yet"
              description="Discover a public deck or create your own to start learning."
              action={<ButtonLink href="/decks">Open library</ButtonLink>}
            />
          ) : (
            <div className="-mx-6 divide-y divide-default-200">
              {deckShortcuts.map(deck => (
                <DashboardDeckRow
                  key={deck.id}
                  deck={deck}
                  stats={
                    deckStats[deck.id] ?? {
                      totalWords: 0,
                      newWordsAvailable: 0,
                      reviewsDue: 0,
                      wordsInReview: 0,
                    }
                  }
                />
              ))}
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
