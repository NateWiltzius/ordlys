import DashboardSrsCard from '@/app/_components/dashboard/dashboard-srs-card';
import ProgressActivityChart from '@/app/_components/progress/progress-activity-chart';
import ProgressDeckList from '@/app/_components/progress/progress-deck-list';
import ProgressOverview from '@/app/_components/progress/progress-overview';
import { getProgressPageData } from '@/server/data/progress-page-data';

export default async function ProgressContent() {
  const data = await getProgressPageData();

  return (
    <div className="space-y-6">
      <ProgressOverview data={data} />
      <ProgressActivityChart activity={data.activity} />
      <DashboardSrsCard counts={data.srsCategoryCounts} />
      <ProgressDeckList decks={data.decks} />
    </div>
  );
}
