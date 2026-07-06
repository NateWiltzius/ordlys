import { PageHeaderSkeleton, SkeletonBlock, SkeletonLine } from '@/components/shared/skeleton';
import { Card } from '@heroui/react';

export default function AccountLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading account" aria-busy="true">
      <span className="sr-only">Loading account…</span>
      <PageHeaderSkeleton actionCount={0} />
      <Card>
        <Card.Header>
          <div className="space-y-2">
            <SkeletonLine className="h-5 w-20" />
            <SkeletonLine className="h-4 w-32" />
          </div>
        </Card.Header>
        <Card.Content>
          <div className="space-y-2">
            <SkeletonLine className="h-4 w-28" />
            <SkeletonLine className="h-5 w-56 max-w-full" />
          </div>
        </Card.Content>
      </Card>
      <Card>
        <Card.Header>
          <div className="space-y-2">
            <SkeletonLine className="h-5 w-20" />
            <SkeletonLine className="h-4 w-72 max-w-full" />
          </div>
        </Card.Header>
        <Card.Content className="flex flex-wrap gap-3">
          <SkeletonBlock className="h-10 w-32 rounded-lg" />
          <SkeletonBlock className="h-10 w-20 rounded-lg" />
        </Card.Content>
      </Card>
      <Card className="border-danger/30">
        <Card.Header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <SkeletonLine className="h-5 w-32" />
            <SkeletonLine className="h-4 w-72 max-w-full" />
          </div>
          <SkeletonBlock className="h-10 w-36 rounded-lg" />
        </Card.Header>
      </Card>
    </div>
  );
}
