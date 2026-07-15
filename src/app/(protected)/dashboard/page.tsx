import DashboardContent from '@/app/_components/dashboard/dashboard-content';
import DashboardLoading from '@/app/_components/dashboard/dashboard-loading';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Today',
  description: 'See what is ready to study and keep your learning moving.',
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}
