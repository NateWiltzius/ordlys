import { SkeletonBlock, SkeletonLine } from '@/components/shared/skeleton';
import { Card } from '@heroui/react';

export default function LessonsSkeleton() {
  return (
    <Card role="status" aria-label="Loading lessons" aria-busy="true">
      <Card.Header>
        <div className="space-y-2">
          <SkeletonLine className="h-5 w-20" />
          <SkeletonLine className="h-4 w-48 max-w-full" />
        </div>
      </Card.Header>
      <Card.Content>
        <div className="divide-y divide-default-200">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex items-center justify-between gap-4 py-3">
              <SkeletonLine className="h-5 w-48 max-w-full" />
              <SkeletonBlock className="h-7 w-28 shrink-0 rounded-full" />
            </div>
          ))}
        </div>
      </Card.Content>
    </Card>
  );
}
