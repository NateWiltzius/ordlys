import { SkeletonBlock, SkeletonLine } from '@/components/shared/skeleton';

export default function LessonsSkeleton() {
  return (
    <section
      className="border-t border-default-200 py-6"
      role="status"
      aria-label="Loading lessons"
      aria-busy="true"
    >
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonLine className="h-5 w-20" />
          <SkeletonLine className="h-4 w-56 max-w-full" />
        </div>
        <SkeletonBlock className="h-7 w-24 shrink-0 rounded-full" />
        <SkeletonBlock className="size-5 shrink-0 rounded-md" />
      </div>
    </section>
  );
}
