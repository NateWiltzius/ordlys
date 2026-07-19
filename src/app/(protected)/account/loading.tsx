import { PageHeaderSkeleton, SkeletonBlock, SkeletonLine } from '@/components/shared/skeleton';

export default function AccountLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading account" aria-busy="true">
      <span className="sr-only">Loading account…</span>
      <PageHeaderSkeleton actionCount={0} />
      <section className="border-t border-default-200 pt-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <SkeletonLine className="h-5 w-20" />
            <SkeletonLine className="h-4 w-32" />
          </div>
          <div className="space-y-2">
            <SkeletonLine className="h-4 w-28" />
            <SkeletonLine className="h-5 w-56 max-w-full" />
          </div>
        </div>
      </section>
      <section className="border-t border-default-200 pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <SkeletonLine className="h-5 w-24" />
            <SkeletonLine className="h-4 w-full max-w-2xl" />
            <SkeletonLine className="h-4 w-4/5 max-w-xl" />
          </div>
          <SkeletonBlock className="h-10 w-40 shrink-0 rounded-lg" />
        </div>
      </section>
      <section className="border-t border-default-200 pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <SkeletonLine className="h-5 w-20" />
            <SkeletonLine className="h-4 w-72 max-w-full" />
          </div>
          <div className="flex flex-wrap gap-3">
            <SkeletonBlock className="h-10 w-32 rounded-lg" />
            <SkeletonBlock className="h-10 w-20 rounded-lg" />
          </div>
        </div>
      </section>
      <section className="border-t border-danger/40 pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <SkeletonLine className="h-5 w-32" />
            <SkeletonLine className="h-4 w-72 max-w-full" />
          </div>
          <SkeletonBlock className="h-10 w-36 rounded-lg" />
        </div>
      </section>
    </div>
  );
}
