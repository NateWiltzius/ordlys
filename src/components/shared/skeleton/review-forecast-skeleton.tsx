import CollapsiblePanel from '@/components/shared/collapsible-panel';
import SkeletonBlock from '@/components/shared/skeleton/skeleton-block';
import SkeletonLine from '@/components/shared/skeleton/skeleton-line';

const barHeights = ['18%', '42%', '24%', '68%', '34%', '12%', '56%', '28%'];

export default function ReviewForecastSkeleton() {
  return (
    <CollapsiblePanel
      title="Review schedule"
      open
      description={<SkeletonLine className="h-6 w-64 max-w-full" />}
    >
      <div className="grid h-40 w-full grid-cols-24 items-end gap-px border-b border-default-200 sm:h-48 sm:gap-1">
        {Array.from({ length: 24 }, (_, index) => (
          <div key={index} className="flex min-w-0 flex-col items-center justify-end gap-2">
            <div className="flex h-28 w-full items-end sm:h-36">
              <SkeletonBlock
                className="w-full rounded-t-sm rounded-b-none"
                style={{ height: barHeights[index % barHeights.length] }}
              />
            </div>
            <SkeletonLine
              className={`h-4 w-3 rounded-sm sm:w-4 ${
                index % 3 === 0 ? '' : 'invisible sm:visible'
              }`}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <SkeletonLine className="h-4 w-16" />
        <SkeletonLine className="h-4 w-20" />
      </div>
    </CollapsiblePanel>
  );
}
