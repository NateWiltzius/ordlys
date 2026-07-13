import {
  SkeletonBlock,
  SkeletonLine,
  ReviewForecastSkeleton,
  StudyActionCardSkeleton,
  StudySummarySkeleton,
} from '@/components/shared/skeleton';
import { Card } from '@heroui/react';

function DeckProgressSkeleton() {
  return (
    <Card>
      <Card.Header className="flex-row items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <SkeletonBlock className="size-11 rounded-xl" />
          <div className="space-y-2">
            <SkeletonLine className="h-5 w-36 max-w-full" />
            <SkeletonLine className="h-4 w-72 max-w-full" />
          </div>
        </div>
        <SkeletonLine className="h-8 w-16" />
      </Card.Header>
      <Card.Content className="space-y-4">
        <div className="flex items-center justify-between">
          <SkeletonLine className="h-4 w-44" />
          <SkeletonLine className="h-4 w-36" />
        </div>
        <SkeletonBlock className="h-3 w-full rounded-full" />
        <div className="flex gap-8">
          {Array.from({ length: 4 }, (_, index) => (
            <SkeletonBlock key={index} className="size-8 rounded-full" />
          ))}
        </div>
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
      <DeckProgressSkeleton />
      <ReviewForecastSkeleton />
      <StudySummarySkeleton />
    </div>
  );
}
