import SkeletonBlock from '@/components/shared/skeleton/skeleton-block';
import SkeletonLine from '@/components/shared/skeleton/skeleton-line';

type Props = {
  actionCount?: number;
  badgeCount?: number;
  descriptionLines?: 1 | 2;
};

export default function PageHeaderSkeleton({
  actionCount = 0,
  badgeCount = 0,
  descriptionLines = 1,
}: Props) {
  return (
    <div className="w-full py-1">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1">
          <SkeletonLine className="h-7 w-32" />
          <SkeletonLine className="h-4 w-full max-w-xl" />
          {descriptionLines === 2 ? (
            <SkeletonLine className="h-4 w-4/5 max-w-md sm:hidden" />
          ) : null}
        </div>
        {actionCount > 0 ? (
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">
            {Array.from({ length: actionCount }, (_, index) => (
              <SkeletonBlock key={index} className="h-10 w-28 rounded-lg" />
            ))}
          </div>
        ) : null}
      </div>
      {badgeCount > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from({ length: badgeCount }, (_, index) => (
            <SkeletonBlock key={index} className="h-7 w-28 rounded-full" />
          ))}
        </div>
      ) : null}
    </div>
  );
}
