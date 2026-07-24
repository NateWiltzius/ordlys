import { SkeletonBlock, SkeletonLine } from '@/components/shared/skeleton';

export default function DeckProgressSkeleton() {
  return (
    <section className="border-t border-default-200 pt-6">
      <div className="min-w-0 space-y-2">
        <SkeletonLine className="h-5 w-36 max-w-full" />
        <SkeletonLine className="h-4 w-72 max-w-full" />
      </div>
      <div className="mt-5 space-y-4">
        <div className="flex items-center justify-between">
          <SkeletonLine className="h-4 w-44" />
          <SkeletonLine className="h-4 w-10" />
        </div>
        <SkeletonBlock className="h-3 w-full rounded-full" />
        <SkeletonLine className="h-4 w-36" />
        <div className="border-l-2 border-default-200 pl-4">
          <SkeletonBlock className="h-24 w-full rounded-lg" />
        </div>
      </div>
    </section>
  );
}
