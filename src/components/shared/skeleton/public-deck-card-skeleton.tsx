import SkeletonBlock from '@/components/shared/skeleton/skeleton-block';
import SkeletonLine from '@/components/shared/skeleton/skeleton-line';
import { Card } from '@heroui/react';

export default function PublicDeckCardSkeleton() {
  return (
    <Card className="flex h-full flex-col">
      <Card.Header className="pb-2">
        <div className="min-w-0 w-full space-y-1">
          <SkeletonLine className="h-7 w-4/5" />
          <div className="space-y-0">
            <SkeletonLine className="h-5 w-full" />
            <SkeletonLine className="h-5 w-3/5" />
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1.5">
            <SkeletonBlock className="h-5 w-16 rounded-full" />
            <SkeletonLine className="h-5 w-28" />
          </div>
        </div>
      </Card.Header>
      <Card.Content className="flex-1 space-y-3">
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          <SkeletonLine className="h-5 w-16" />
          <SkeletonLine className="h-5 w-16" />
          <SkeletonLine className="h-5 w-20" />
        </div>
      </Card.Content>
      <Card.Footer>
        <SkeletonBlock className="h-10 w-full rounded-lg md:h-9" />
      </Card.Footer>
    </Card>
  );
}
