import { SkeletonBlock, SkeletonLine, StudySummarySkeleton } from '@/components/shared/skeleton';
import { Card } from '@heroui/react';

function StudyActionCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden border bg-gradient-to-br shadow-md">
      <Card.Header className="flex-row items-start gap-3">
        <SkeletonBlock className="size-11 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonLine className="h-6 w-36" />
          <SkeletonLine className="h-4 w-full" />
          <SkeletonLine className="h-4 w-3/4" />
        </div>
      </Card.Header>

      <Card.Content className="flex items-baseline gap-2">
        <SkeletonLine className="h-10 w-14" />
        <SkeletonLine className="h-5 w-24" />
      </Card.Content>

      <Card.Footer>
        <SkeletonBlock className="h-12 w-full rounded-lg" />
      </Card.Footer>
    </Card>
  );
}

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
