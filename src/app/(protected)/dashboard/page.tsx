import DashboardContent from '@/app/_components/dashboard/dashboard-content';
import DashboardLoading from '@/app/_components/dashboard/dashboard-loading';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Track your active decks, due reviews, and learning progress.',
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}
