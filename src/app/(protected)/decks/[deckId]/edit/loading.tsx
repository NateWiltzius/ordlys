import LessonEditorSkeleton from '@/app/(protected)/decks/[deckId]/edit/_components/lesson-editor-skeleton';
import { PageHeaderSkeleton, SkeletonBlock, SkeletonLine } from '@/components/shared/skeleton';
import { Card } from '@heroui/react';

export default function EditDeckLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading deck editor" aria-busy="true">
      <span className="sr-only">Loading deck editor…</span>
      <PageHeaderSkeleton actionCount={2} />
      <div className="grid w-full grid-cols-2 gap-2">
        <SkeletonBlock className="h-10 w-full rounded-lg" />
        <SkeletonBlock className="h-10 w-full rounded-lg" />
      </div>

      <Card>
        <Card.Header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <SkeletonLine className="h-5 w-20" />
            <SkeletonLine className="h-4 w-72 max-w-full" />
          </div>
          <div className="flex items-center gap-3">
            <SkeletonLine className="h-4 w-32" />
            <SkeletonBlock className="h-10 w-28 rounded-lg" />
          </div>
        </Card.Header>
        <Card.Content>
          <div className="divide-y divide-default-200">
            {Array.from({ length: 2 }, (_, index) => (
              <LessonEditorSkeleton key={index} />
            ))}
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
