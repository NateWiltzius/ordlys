import SkeletonBlock from '@/components/shared/skeleton/skeleton-block';
import SkeletonLine from '@/components/shared/skeleton/skeleton-line';
import { Card } from '@heroui/react';

type Props = {
  showMeta?: boolean;
};

export default function DeckCardSkeleton({ showMeta = false }: Props) {
  return (
    <Card className="flex h-full w-full flex-col">
      <Card.Header className="flex items-start justify-between gap-3 pb-2">
        <div className="min-w-0 flex-1 space-y-1">
          <SkeletonLine className="h-6 w-4/5" />
          <SkeletonLine className="h-4 w-full" />
          <SkeletonLine className="h-4 w-3/5" />
        </div>
        <SkeletonBlock className="h-7 w-16 shrink-0 rounded-full" />
      </Card.Header>
      <div className="min-h-6 flex-1" />
      <Card.Footer>
        <div className="flex w-full flex-col gap-2">
          {showMeta ? <SkeletonLine className="h-4 w-20" /> : null}
          <div className="flex items-start gap-2">
            <SkeletonBlock className="h-8 flex-1 rounded-lg" />
            <SkeletonBlock className="h-8 w-20 rounded-lg" />
            <SkeletonBlock className="h-8 w-9 rounded-lg" />
          </div>
        </div>
      </Card.Footer>
    </Card>
  );
}
