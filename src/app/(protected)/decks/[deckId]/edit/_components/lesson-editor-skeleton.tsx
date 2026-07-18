import { SkeletonBlock, SkeletonLine } from '@/components/shared/skeleton';

export default function LessonEditorSkeleton() {
  return (
    <div className="flex items-center gap-4 py-3">
      <SkeletonLine className="h-5 w-48 max-w-full flex-1" />
      <SkeletonBlock className="h-7 w-20 shrink-0 rounded-full" />
      <SkeletonBlock className="size-5 shrink-0 rounded-md" />
    </div>
  );
}
