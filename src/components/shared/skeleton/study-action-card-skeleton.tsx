import SkeletonBlock from '@/components/shared/skeleton/skeleton-block';
import SkeletonLine from '@/components/shared/skeleton/skeleton-line';
import { Card } from '@heroui/react';

type Props = {
  descriptionLines?: 1 | 2;
};

export default function StudyActionCardSkeleton({ descriptionLines = 1 }: Props) {
  return (
    <Card className="h-full overflow-hidden bg-gradient-to-br">
      <Card.Header className="flex-row items-start gap-3">
        <SkeletonBlock className="size-11 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonLine className="h-5 w-40" />
          <SkeletonLine className="h-4 w-full max-w-md" />
          {descriptionLines === 2 ? <SkeletonLine className="h-4 w-3/4 max-w-sm" /> : null}
        </div>
      </Card.Header>
      <Card.Content className="flex items-baseline gap-2">
        <SkeletonLine className="h-10 w-16" />
        <SkeletonLine className="h-4 w-48 max-w-full" />
      </Card.Content>
      <Card.Footer>
        <SkeletonBlock className="h-12 w-full rounded-lg" />
      </Card.Footer>
    </Card>
  );
}
