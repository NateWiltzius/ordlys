import {
  SkeletonBlock,
  SkeletonLine,
  StudyActionCardSkeleton,
  StudySummarySkeleton,
} from '@/components/shared/skeleton';
import { Card } from '@heroui/react';

function CurrentLessonSkeleton() {
  return (
    <Card>
      <Card.Header>
        <div className="space-y-2">
          <SkeletonLine className="h-5 w-48 max-w-full" />
          <SkeletonLine className="h-4 w-72 max-w-full" />
        </div>
      </Card.Header>
      <Card.Content className="space-y-2">
        <div className="flex items-center justify-between">
          <SkeletonLine className="h-4 w-24" />
          <SkeletonLine className="h-4 w-12" />
        </div>
        <SkeletonBlock className="h-3 w-full rounded-full" />
        <SkeletonLine className="h-4 w-80 max-w-full" />
      </Card.Content>
    </Card>
  );
}

export function StudyContentSkeleton() {
  return (
    <div
      className="space-y-6"
      role="status"
      aria-label="Loading study information"
      aria-busy="true"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <StudyActionCardSkeleton />
        <StudyActionCardSkeleton />
      </div>
      <CurrentLessonSkeleton />
      <StudySummarySkeleton />
    </div>
  );
}
