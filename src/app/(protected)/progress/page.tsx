import ProgressContent from '@/app/_components/progress/progress-content';
import ProgressLoading from '@/app/_components/progress/progress-loading';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Progress',
  description: 'Track vocabulary growth, memory strength, and recent study activity.',
};

export default function ProgressPage() {
  return (
    <Suspense fallback={<ProgressLoading />}>
      <ProgressContent />
    </Suspense>
  );
}
