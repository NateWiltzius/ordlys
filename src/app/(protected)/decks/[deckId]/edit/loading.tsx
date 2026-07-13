import { PageHeaderSkeleton, SkeletonBlock, SkeletonLine } from '@/components/shared/skeleton';
import { Card } from '@heroui/react';

export default function EditDeckLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading deck editor" aria-busy="true">
      <span className="sr-only">Loading deck editor…</span>
      <PageHeaderSkeleton actionCount={3} />
      <PublicationPanelSkeleton />

      <Card>
        <Card.Header className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <SkeletonLine className="h-5 w-20" />
            <SkeletonLine className="h-4 w-72 max-w-full" />
          </div>
          <SkeletonLine className="h-4 w-16" />
        </Card.Header>
        <Card.Content className="space-y-4">
          {Array.from({ length: 2 }, (_, index) => (
            <LessonEditorSkeleton key={index} />
          ))}
        </Card.Content>
      </Card>
    </div>
  );
}

function PublicationPanelSkeleton() {
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
        <SkeletonLine className="h-px w-full rounded-none" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }, (_, index) => (
            <div key={index} className="space-y-2">
              <SkeletonLine className="h-4 w-24" />
              <SkeletonBlock className="h-10 w-full rounded-lg" />
              <SkeletonLine className="h-4 w-4/5" />
            </div>
          ))}
        </div>
        <SkeletonLine className="h-px w-full rounded-none" />
        <div className="flex gap-2">
          <SkeletonBlock className="h-10 w-28 rounded-lg" />
          <SkeletonBlock className="h-10 w-28 rounded-lg" />
        </div>
      </Card.Content>
    </Card>
  );
}

function LessonEditorSkeleton() {
  return (
    <Card variant="secondary">
      <Card.Header className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <SkeletonLine className="h-5 w-40" />
          <SkeletonLine className="h-4 w-52" />
        </div>
        <div className="flex items-center gap-1">
          <SkeletonBlock className="h-8 w-16 rounded-lg" />
          <SkeletonBlock className="h-7 w-16 rounded-full" />
          <SkeletonBlock className="size-8 rounded-lg" />
          <SkeletonBlock className="size-8 rounded-lg" />
          <SkeletonBlock className="h-8 w-24 rounded-lg" />
        </div>
      </Card.Header>
    </Card>
  );
}
