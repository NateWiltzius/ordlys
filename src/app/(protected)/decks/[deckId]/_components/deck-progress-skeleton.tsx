import { SkeletonBlock, SkeletonLine } from '@/components/shared/skeleton';

export default function DeckProgressSkeleton() {
  return (
    <section className="border-t border-default-200 pt-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonLine className="h-5 w-36 max-w-full" />
          <SkeletonLine className="h-4 w-72 max-w-full" />
        </div>
        <SkeletonLine className="h-8 w-16" />
      </div>
      <div className="mt-5 space-y-4">
        <div className="flex items-center justify-between">
          <SkeletonLine className="h-4 w-44" />
          <SkeletonLine className="h-4 w-36" />
        </div>
        <SkeletonBlock className="h-3 w-full rounded-full" />
        <div className="flex gap-8">
          {Array.from({ length: 4 }, (_, index) => (
            <SkeletonBlock key={index} className="size-8 rounded-full" />
          ))}
        </div>
      </div>
    </section>
  );
}
