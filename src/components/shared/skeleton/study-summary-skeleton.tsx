import SkeletonLine from '@/components/shared/skeleton/skeleton-line';
import { Card } from '@heroui/react';

export default function StudySummarySkeleton() {
  return (
    <Card>
      <Card.Header>
        <div className="space-y-2">
          <SkeletonLine className="h-5 w-36" />
          <SkeletonLine className="h-4 w-64 max-w-full" />
        </div>
      </Card.Header>
      <Card.Content>
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="rounded-lg bg-default-100 px-3 py-2">
              <SkeletonLine className="h-4 w-24" />
              <SkeletonLine className="mt-2 h-6 w-12" />
            </div>
          ))}
        </div>
      </Card.Content>
    </Card>
  );
}
