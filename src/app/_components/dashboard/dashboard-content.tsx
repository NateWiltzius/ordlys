import PageSection from '@/components/shared/layout/page-section';
import ButtonLink from '@/components/shared/button-link';
import EmptyState from '@/components/shared/empty-state';
import DashboardDeckRow from '@/app/_components/dashboard/dashboard-deck-row';
import { getDashboardDataAction } from '@/server/deck.actions';
import ReviewForecastCard from '@/components/shared/review-forecast-card';
import DashboardReviewCard from '@/app/_components/dashboard/dashboard-review-card';
import DashboardRecentMistakesCard from '@/app/_components/dashboard/dashboard-recent-mistakes-card';
import { getRecentMistakeCountAction } from '@/server/review.actions';
import DashboardLearningCard from '@/app/_components/dashboard/dashboard-learning-card';
import { DashboardAction, getDashboardActionOrder } from '@/lib/dashboard-actions';

export default async function DashboardContent() {
  const [dashboardData, recentMistakeCount] = await Promise.all([
    getDashboardDataAction(),
    getRecentMistakeCountAction(),
  ]);
  const { activeDecks, allDeckStats, deckStats, reviewForecast, nextReview } = dashboardData;
  const deckShortcuts = [...activeDecks]
    .sort((first, second) => {
      const firstStats = deckStats[first.id];
      const secondStats = deckStats[second.id];
      const reviewDifference = secondStats.reviewsDue - firstStats.reviewsDue;

      if (reviewDifference !== 0) return reviewDifference;
      return secondStats.newWordsAvailable - firstStats.newWordsAvailable;
    })
    .slice(0, 3);
  const actionOrder = getDashboardActionOrder({
    reviewsDue: allDeckStats.reviewsDue,
    newWordsAvailable: allDeckStats.newWordsAvailable,
    recentMistakes: recentMistakeCount,
  });
  const actionCards: Record<DashboardAction, React.ReactNode> = {
    review: (
      <DashboardReviewCard
        decks={activeDecks}
        deckStats={deckStats}
        reviewsDue={allDeckStats.reviewsDue}
      />
    ),
    learn: (
      <DashboardLearningCard
        decks={activeDecks}
        deckStats={deckStats}
        newWordsAvailable={allDeckStats.newWordsAvailable}
      />
    ),
    practice: <DashboardRecentMistakesCard count={recentMistakeCount} />,
  };
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {actionOrder.map((action, index) => (
          <div
            key={action}
            className={index === 2 ? 'h-full md:col-span-2 xl:col-span-1' : 'h-full'}
          >
            {actionCards[action]}
          </div>
        ))}
      </div>

      <ReviewForecastCard forecast={reviewForecast} nextReview={nextReview} surface="section" />

      <PageSection
        title="Deck shortcuts"
        description="Your most relevant decks based on reviews and new cards available."
        action={
          activeDecks.length > 0 ? (
            <ButtonLink href="/decks" variant="tertiary" size="sm">
              View library
            </ButtonLink>
          ) : null
        }
        contentClassName={activeDecks.length > 0 ? 'divide-y divide-default-200' : undefined}
      >
        {activeDecks.length === 0 ? (
          <EmptyState
            title="No active decks yet"
            description="Discover a public deck or create your own to start learning."
            action={<ButtonLink href="/decks">Open library</ButtonLink>}
          />
        ) : (
          deckShortcuts.map(deck => (
            <DashboardDeckRow key={deck.id} deck={deck} stats={deckStats[deck.id]} />
          ))
        )}
      </PageSection>
    </div>
  );
}
