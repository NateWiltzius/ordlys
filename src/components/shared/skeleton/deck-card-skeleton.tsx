import SkeletonBlock from '@/components/shared/skeleton/skeleton-block';
import SkeletonLine from '@/components/shared/skeleton/skeleton-line';
import { Card } from '@heroui/react';

type Props = {
  showMeta?: boolean;
  layout?: 'card' | 'row';
};

export default function DeckCardSkeleton({ showMeta = false, layout = 'card' }: Props) {
  if (layout === 'row') {
    return (
      <div className="py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <SkeletonLine className="h-6 w-64 max-w-4/5" />
            <div className="mt-2 flex items-center gap-2">
              <SkeletonBlock className="h-5 w-14 rounded-full" />
              <SkeletonBlock className="h-5 w-14 rounded-full" />
              <SkeletonLine className="h-4 w-32" />
            </div>
            <SkeletonLine className="mt-2 h-4 w-3/5" />
            <div className="mt-2 flex gap-2">
              <SkeletonBlock className="h-5 w-14 rounded-full" />
              <SkeletonBlock className="h-5 w-14 rounded-full" />
            </div>
            <div className="mt-3 flex max-w-xl items-center justify-between gap-3">
              <SkeletonLine className="h-3 w-36" />
              <SkeletonLine className="h-3 w-8" />
            </div>
            <SkeletonBlock className="mt-2 h-2 max-w-xl rounded-full" />
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <SkeletonBlock className="h-8 flex-1 rounded-lg sm:w-24 sm:flex-none" />
            <SkeletonBlock className="h-8 w-9 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="flex h-full w-full flex-col">
      <Card.Header className="items-start gap-3 pb-2">
        <div className="w-full space-y-1">
          <SkeletonLine className="h-7 w-3/4" />
          <SkeletonLine className="h-4 w-full" />
          <SkeletonLine className="h-4 w-2/3" />
        </div>
        <div className="flex items-center gap-2">
          <SkeletonBlock className="h-5 w-14 rounded-full" />
          <SkeletonBlock className="h-5 w-12 rounded-full" />
          <SkeletonLine className="h-4 w-28" />
        </div>
      </Card.Header>
      <Card.Content className="flex-1 space-y-3">
        {showMeta ? (
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            <SkeletonLine className="h-4 w-16" />
            <SkeletonLine className="h-4 w-16" />
            <SkeletonLine className="h-4 w-20" />
          </div>
        ) : null}
      </Card.Content>
      <Card.Footer>
        <div className="flex w-full flex-col gap-2">
          <div className="flex items-start gap-2">
            <SkeletonBlock className="h-10 flex-1 rounded-lg" />
            <SkeletonBlock className="h-8 w-9 rounded-lg" />
          </div>
        </div>
      </Card.Footer>
    </Card>
  );
}
