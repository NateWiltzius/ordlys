import LessonEditorSkeleton from '@/app/(protected)/decks/[deckId]/edit/_components/lesson-editor-skeleton';
import { PageHeaderSkeleton, SkeletonBlock, SkeletonLine } from '@/components/shared/skeleton';
import PageSection from '@/components/shared/layout/page-section';

export default function EditDeckLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading deck editor" aria-busy="true">
      <span className="sr-only">Loading deck editor…</span>
      <PageHeaderSkeleton actionCount={2} showBackLink />
      <div>
        <SkeletonBlock className="h-10 w-full rounded-xl sm:max-w-md" />
        <div className="pt-4">
          <PageSection
            title="Lessons"
            description="Search the deck or select a lesson to edit its cards."
            action={
              <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                <SkeletonLine className="h-5 w-32" />
                <SkeletonBlock className="h-10 w-28 rounded-lg" />
              </div>
            }
          >
            <div className="grid items-start gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
              <aside className="hidden overflow-hidden rounded-xl border border-default-200 bg-default-50/40 lg:block">
                <div className="border-b border-default-200 px-3 py-3">
                  <p className="text-sm font-semibold">Lesson navigator</p>
                  <p className="mt-0.5 text-xs text-muted">Select a lesson to edit its cards.</p>
                </div>
                <div className="space-y-1 p-2">
                  {Array.from({ length: 3 }, (_, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-2 px-2.5 py-2"
                    >
                      <SkeletonLine className="h-5 w-32" />
                      <SkeletonLine className="h-4 w-6" />
                    </div>
                  ))}
                </div>
              </aside>
              <div className="min-w-0 space-y-3">
                <div className="space-y-2 lg:hidden">
                  <SkeletonLine className="h-5 w-12" />
                  <SkeletonBlock className="h-10 w-full rounded-lg" />
                </div>
                <div className="rounded-lg border border-default-200 bg-default-50 p-3 sm:p-4">
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                    <SkeletonLine className="h-5 w-24" />
                    <SkeletonLine className="h-4 w-48 sm:h-5" />
                  </div>
                  <SkeletonBlock className="mt-2 h-10 w-full rounded-lg" />
                </div>
                <LessonEditorSkeleton />
              </div>
            </div>
          </PageSection>
        </div>
      </div>
    </div>
  );
}
