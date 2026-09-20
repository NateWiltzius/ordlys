import SkeletonBlock from '@/components/shared/skeleton/skeleton-block';
import SkeletonLine from '@/components/shared/skeleton/skeleton-line';
import { Card } from '@heroui/react';

type Props = {
  descriptionLines?: 1 | 2;
};

export default function StudyActionCardSkeleton({ descriptionLines = 1 }: Props) {
  return (
    <Card className="h-full overflow-hidden border">
      <Card.Header className="flex-row items-start gap-3">
        <SkeletonBlock className="size-11 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1">
          <SkeletonLine className="h-7 w-40 max-w-full" />
          <div className="min-h-12">
            <SkeletonLine className="h-6 w-full max-w-md" />
            {descriptionLines === 2 ? <SkeletonLine className="h-6 w-3/4 max-w-sm" /> : null}
          </div>
        </div>
      </Card.Header>
      <Card.Content className="flex items-baseline gap-2">
        <SkeletonLine className="h-10 w-16" />
        <SkeletonLine className="h-6 w-32 max-w-full" />
      </Card.Content>
      <Card.Footer>
        <SkeletonBlock className="h-11 w-full rounded-lg md:h-10" />
      </Card.Footer>
    </Card>
  );
}
