import DashboardShortcutsSection from '@/app/_components/dashboard/dashboard-shortcuts-section';
import SkeletonBlock from '@/components/shared/skeleton/skeleton-block';
import SkeletonLine from '@/components/shared/skeleton/skeleton-line';

export default function DashboardDeckListSkeleton() {
  return (
    <DashboardShortcutsSection>
      {Array.from({ length: 1 }, (_, index) => (
        <div key={index} className="py-4">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonLine className="h-6 w-48 max-w-full" />
              <SkeletonLine className="h-6 w-full max-w-xl" />
            </div>
            <div className="flex h-8 shrink-0 items-center gap-2 sm:justify-end">
              <SkeletonBlock className="h-5 w-14 rounded-full" />
              <SkeletonBlock className="h-5 w-14 rounded-full" />
              <SkeletonBlock className="h-8 w-16 rounded-lg" />
              <SkeletonBlock className="h-8 w-14 rounded-lg" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <SkeletonLine className="h-4 w-36" />
            <SkeletonLine className="h-4 w-8" />
          </div>
          <SkeletonBlock className="mt-2 h-1 w-full rounded-full" />
        </div>
      ))}
    </DashboardShortcutsSection>
  );
}
