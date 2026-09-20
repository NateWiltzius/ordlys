import { SkeletonBlock, SkeletonLine } from '@/components/shared/skeleton';
import VocabularyLoading from './vocabulary-loading';

export default function LessonEditorSkeleton() {
  return (
    <section className="overflow-hidden rounded-xl border border-default-200 bg-background">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-default-200 bg-default-50/60 px-4 py-3">
        <div className="min-w-0">
          <SkeletonLine className="h-4 w-12" />
          <SkeletonLine className="mt-0.5 h-6 w-48 max-w-full" />
        </div>
        <SkeletonBlock className="h-6 w-20 rounded-full" />
      </div>
      <div className="space-y-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
            <SkeletonLine className="h-5 w-48 max-w-full" />
            <div className="flex flex-wrap gap-2">
              <SkeletonBlock className="h-8 w-24 rounded-lg" />
              <SkeletonBlock className="h-8 w-24 rounded-lg" />
              <SkeletonBlock className="h-8 w-28 rounded-lg" />
            </div>
          </div>
          <div className="flex items-center gap-1 sm:border-l sm:border-default-200 sm:pl-3">
            <SkeletonBlock className="size-8 rounded-lg" />
            <SkeletonLine className="h-4 w-12" />
            <SkeletonBlock className="size-8 rounded-lg" />
            <SkeletonBlock className="size-8 rounded-lg" />
          </div>
        </div>
        <VocabularyLoading />
      </div>
    </section>
  );
}
