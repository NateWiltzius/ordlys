import DashboardDeckCard from '@/components/deck/dashboard-deck-card';
import PageHeader from '@/components/shared/layout/page-header';
import { getAllDecksStudyCountsAction, getUserSubscribedDecksAction } from '@/server/deck.actions';

export default async function DashboardPage() {
  const allDeckStats = await getAllDecksStudyCountsAction();
  const activeDecks = await getUserSubscribedDecksAction();

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Here are your active decks and their study counts."
      />
      <div className="rounded-xl border border-default-200 bg-default-50/70 p-4 shadow-sm">
        <h3 className="text-lg font-semibold">Learning summary</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-default-200 bg-white p-3">
            <p className="text-sm text-default-500">Cards in your learning decks</p>
            <p className="mt-1 text-xl font-semibold text-default-700">
              {allDeckStats.totalWords}
            </p>
          </div>
          <div className="rounded-lg border border-default-200 bg-white p-3">
            <p className="text-sm text-default-500">Reviews due</p>
            <p className="mt-1 text-xl font-semibold text-default-700">
              {allDeckStats.reviewsDue}
            </p>
          </div>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {activeDecks.map(deck => (
          <DashboardDeckCard key={deck.id} deck={deck} />
        ))}
      </div>
    </>
  );
}
