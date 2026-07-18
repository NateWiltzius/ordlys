import { SkeletonBlock, SkeletonLine } from '@/components/shared/skeleton';
import { Card } from '@heroui/react';

export default function PublicationPanelSkeleton() {
  return (
    <Card>
      <Card.Header className="flex-col items-start gap-2 sm:flex-row sm:justify-between">
        <div className="space-y-2">
          <SkeletonLine className="h-5 w-52" />
          <SkeletonLine className="h-4 w-80 max-w-full" />
        </div>
        <SkeletonBlock className="h-7 w-32 rounded-full" />
      </Card.Header>
      <Card.Content className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <SkeletonLine className="h-4 w-28" />
            <SkeletonBlock className="h-10 w-full rounded-lg" />
          </div>
          <SkeletonBlock className="h-10 w-full rounded-lg sm:w-32" />
        </div>
        <div className="space-y-2">
          <SkeletonLine className="h-4 w-40" />
          <SkeletonBlock className="h-10 w-full rounded-lg" />
          <SkeletonLine className="h-4 w-4/5 max-w-2xl" />
        </div>
        <div className="rounded-xl border border-default-200 bg-default-50/50 px-4 py-3">
          <SkeletonLine className="h-5 w-56 max-w-full" />
        </div>
      </Card.Content>
    </Card>
  );
}
