import ProgressContent from '@/app/_components/progress/progress-content';
import ProgressLoading from '@/app/_components/progress/progress-loading';
import PageHeader from '@/components/shared/layout/page-header';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Progress',
  description: 'Track card coverage, memory strength, and recent study activity.',
};

export default function ProgressPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Progress"
        description="See how your cards, recall, and study habits are developing over time."
      />
      <Suspense fallback={<ProgressLoading showHeader={false} />}>
        <ProgressContent />
      </Suspense>
    </div>
  );
}
