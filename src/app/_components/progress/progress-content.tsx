import DashboardSrsCard from '@/app/_components/dashboard/dashboard-srs-card';
import ProgressActivityChart from '@/app/_components/progress/progress-activity-chart';
import ProgressDeckList from '@/app/_components/progress/progress-deck-list';
import ProgressOverview from '@/app/_components/progress/progress-overview';
import PageHeader from '@/components/shared/layout/page-header';
import { getProgressPageDataAction } from '@/server/progress.actions';

export default async function ProgressContent() {
  const data = await getProgressPageDataAction();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Progress"
        description="See how your cards, recall, and study habits are developing over time."
      />
      <ProgressOverview data={data} />
      <ProgressActivityChart activity={data.activity} />
      <DashboardSrsCard counts={data.srsCategoryCounts} />
      <ProgressDeckList decks={data.decks} />
    </div>
  );
}
