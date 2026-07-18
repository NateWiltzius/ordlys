import LessonEditorSkeleton from '@/app/(protected)/decks/[deckId]/edit/_components/lesson-editor-skeleton';
import PublicationPanelSkeleton from '@/app/(protected)/decks/[deckId]/edit/_components/publication-panel-skeleton';
import { PageHeaderSkeleton, SkeletonLine } from '@/components/shared/skeleton';
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
          <SkeletonLine className="h-4 w-32" />
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
