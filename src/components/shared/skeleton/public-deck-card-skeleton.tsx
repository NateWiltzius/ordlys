import SkeletonBlock from '@/components/shared/skeleton/skeleton-block';
import SkeletonLine from '@/components/shared/skeleton/skeleton-line';
import { Card } from '@heroui/react';

export default function PublicDeckCardSkeleton() {
  return (
    <Card className="flex h-full flex-col">
      <Card.Header className="flex-row items-start justify-between gap-3 pb-2">
        <div className="min-w-0 flex-1 space-y-1">
          <SkeletonLine className="h-6 w-4/5" />
          <SkeletonLine className="h-4 w-full" />
          <SkeletonLine className="h-4 w-3/5" />
        </div>
        <SkeletonBlock className="h-7 w-16 shrink-0 rounded-full" />
      </Card.Header>
      <Card.Content className="flex-1 space-y-3">
        <SkeletonLine className="h-4 w-36" />
        <div className="flex gap-5">
          <SkeletonLine className="h-4 w-16" />
          <SkeletonLine className="h-4 w-16" />
          <SkeletonLine className="h-4 w-20" />
        </div>
      </Card.Content>
      <Card.Footer>
        <SkeletonBlock className="h-10 w-full rounded-lg" />
      </Card.Footer>
    </Card>
  );
}
