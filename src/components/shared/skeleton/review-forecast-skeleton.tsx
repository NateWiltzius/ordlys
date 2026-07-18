import SkeletonBlock from '@/components/shared/skeleton/skeleton-block';
import SkeletonLine from '@/components/shared/skeleton/skeleton-line';
import { Card } from '@heroui/react';

const barHeights = ['18%', '42%', '24%', '68%', '34%', '12%', '56%', '28%'];

export default function ReviewForecastSkeleton() {
  return (
    <Card>
      <Card.Header className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-start">
        <div className="space-y-2">
          <SkeletonLine className="h-5 w-36" />
          <SkeletonLine className="h-4 w-64 max-w-full" />
          <SkeletonLine className="h-4 w-44" />
        </div>
        <div className="flex shrink-0 items-center justify-between gap-3 rounded-lg border border-default-200 bg-default-50 px-3 py-2 sm:block sm:w-24 sm:text-right">
          <SkeletonLine className="h-3 w-14" />
          <SkeletonLine className="mt-2 h-6 w-8 sm:ml-auto" />
        </div>
      </Card.Header>
      <Card.Content>
        <div className="grid h-40 w-full grid-cols-24 items-end gap-px border-b border-default-200 sm:h-48 sm:gap-1">
          {Array.from({ length: 24 }, (_, index) => (
            <div key={index} className="flex min-w-0 flex-col items-center justify-end gap-2">
              <div className="flex h-28 w-full items-end sm:h-36">
                <SkeletonBlock
                  className="w-full rounded-t-sm rounded-b-none"
                  style={{ height: barHeights[index % barHeights.length] }}
                />
              </div>
              <SkeletonLine className="h-3 w-3 rounded-sm sm:w-4" />
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <SkeletonLine className="h-3 w-16" />
          <SkeletonLine className="h-3 w-20" />
        </div>
      </Card.Content>
    </Card>
  );
}
