import { SkeletonBlock, SkeletonLine } from '@/components/shared/skeleton';

export default function DeckProgressSkeleton() {
  return (
    <section className="rounded-xl border border-default-200 bg-default-50/50 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <SkeletonLine className="h-4 w-28" />
        <SkeletonLine className="h-3 w-16" />
      </div>
      <SkeletonLine className="mt-2 h-6 w-56 max-w-full" />
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between gap-4">
          <SkeletonLine className="h-4 w-36" />
          <SkeletonLine className="h-4 w-12" />
        </div>
        <SkeletonBlock className="h-2 w-full rounded-full" />
        <SkeletonLine className="h-3 w-44 max-w-full" />
      </div>
      <div className="mt-4 border-t border-default-200 pt-3">
        <SkeletonLine className="h-4 w-80 max-w-full" />
      </div>
    </section>
  );
}
