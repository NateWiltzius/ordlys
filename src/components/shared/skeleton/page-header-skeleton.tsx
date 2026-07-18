import SkeletonBlock from '@/components/shared/skeleton/skeleton-block';
import SkeletonLine from '@/components/shared/skeleton/skeleton-line';
import { Card } from '@heroui/react';

type Props = {
  actionCount?: number;
  badgeCount?: number;
};

export default function PageHeaderSkeleton({ actionCount = 0, badgeCount = 0 }: Props) {
  return (
    <Card className="w-full">
      <Card.Header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonLine className="h-7 w-44" />
          <SkeletonLine className="h-4 w-full max-w-2xl" />
        </div>
        {actionCount > 0 ? (
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">
            {Array.from({ length: actionCount }, (_, index) => (
              <SkeletonBlock key={index} className="h-10 w-28 rounded-lg" />
            ))}
          </div>
        ) : null}
      </Card.Header>
      {badgeCount > 0 ? (
        <Card.Content className="pt-0">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: badgeCount }, (_, index) => (
              <SkeletonBlock key={index} className="h-7 w-28 rounded-full" />
            ))}
          </div>
        </Card.Content>
      ) : null}
    </Card>
  );
}
