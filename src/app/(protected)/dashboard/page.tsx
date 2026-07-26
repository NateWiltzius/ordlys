import DashboardContent from '@/app/_components/dashboard/dashboard-content';
import DashboardLoading from '@/app/_components/dashboard/dashboard-loading';
import PageHeader from '@/components/shared/layout/page-header';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Today',
  description: 'See what is ready to study and keep your learning moving.',
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Today"
        description="Start what is ready now and keep your learning moving."
      />
      <Suspense fallback={<DashboardLoading showHeader={false} />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
