import SkeletonBlock from '@/components/shared/skeleton/skeleton-block';
import SkeletonLine from '@/components/shared/skeleton/skeleton-line';
import { Card } from '@heroui/react';

export default function SrsDistributionSkeleton() {
  return (
    <Card>
      <Card.Header className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <SkeletonLine className="h-5 w-36" />
          <SkeletonLine className="h-4 w-72 max-w-full" />
        </div>
        <SkeletonLine className="h-4 w-16" />
      </Card.Header>
      <Card.Content className="space-y-4">
        <SkeletonBlock className="h-3 w-full rounded-full" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <SkeletonBlock key={index} className="h-24 rounded-xl" />
          ))}
        </div>
      </Card.Content>
    </Card>
  );
}
