import { SkeletonBlock, SkeletonLine } from '@/components/shared/skeleton';
import { Card } from '@heroui/react';

export default function DeckProgressSkeleton() {
  return (
    <Card>
      <Card.Header className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <SkeletonBlock className="size-11 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
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
