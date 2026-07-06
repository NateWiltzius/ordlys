import { Card } from '@heroui/react';
import type { CSSProperties } from 'react';

type SkeletonBlockProps = {
  className?: string;
  style?: CSSProperties;
};

export function SkeletonBlock({ className = '', style }: SkeletonBlockProps) {
  return (
    <div
      className={`animate-pulse rounded-xl border border-default-200 bg-default-200/80 shadow-sm ${className}`}
      style={style}
    />
  );
}

export function SkeletonLine({ className = 'h-4 w-full' }: SkeletonBlockProps) {
  return <SkeletonBlock className={`rounded-md ${className}`} />;
}

type PageHeaderSkeletonProps = {
  actionCount?: number;
  badgeCount?: number;
};

export function PageHeaderSkeleton({ actionCount = 1, badgeCount = 0 }: PageHeaderSkeletonProps) {
  return (
    <Card className="w-full">
      <Card.Header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonLine className="h-7 w-44" />
          <SkeletonLine className="h-4 w-full max-w-2xl" />
        </div>
        {actionCount > 0 ? (
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">
            {Array.from({ length: actionCount }, (_, index) => (
              <SkeletonBlock key={index} className="h-10 w-28 rounded-lg" />
            ))}
          </div>
        ) : null}
      </Card.Header>
      {badgeCount > 0 ? (
        <Card.Content className="pt-0">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: badgeCount }, (_, index) => (
              <SkeletonBlock key={index} className="h-7 w-28 rounded-full" />
            ))}
          </div>
        </Card.Content>
      ) : null}
    </Card>
  );
}

export function StudySummarySkeleton() {
  return (
    <Card>
      <Card.Header>
        <div className="space-y-2">
          <SkeletonLine className="h-5 w-36" />
          <SkeletonLine className="h-4 w-64 max-w-full" />
        </div>
      </Card.Header>
      <Card.Content>
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="rounded-lg bg-default-100 px-3 py-2">
              <SkeletonLine className="h-4 w-24" />
              <SkeletonLine className="mt-2 h-6 w-12" />
            </div>
          ))}
        </div>
      </Card.Content>
    </Card>
  );
}

export function ReviewForecastSkeleton() {
  return (
    <Card>
      <Card.Header className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-start">
        <div className="space-y-2">
          <SkeletonLine className="h-5 w-36" />
          <SkeletonLine className="h-4 w-64 max-w-full" />
          <SkeletonLine className="h-4 w-44" />
        </div>
        <div className="flex shrink-0 items-center justify-between gap-3 rounded-lg border border-default-200 bg-default-50 px-3 py-2 sm:block sm:w-24 sm:text-right">
          <SkeletonLine className="h-3 w-14" />
          <SkeletonLine className="mt-2 h-6 w-8 sm:ml-auto" />
        </div>
      </Card.Header>
      <Card.Content>
        <div className="grid h-40 w-full grid-cols-24 items-end gap-px border-b border-default-200 sm:h-48 sm:gap-1">
          {Array.from({ length: 24 }, (_, index) => (
            <div key={index} className="flex min-w-0 flex-col items-center justify-end gap-2">
              <div className="flex h-28 w-full items-end sm:h-36">
                <SkeletonBlock
                  className="w-full rounded-t-sm rounded-b-none"
                  style={{ height: barHeights[index % barHeights.length] }}
                />
              </div>
              <SkeletonLine className="h-3 w-3 rounded-sm sm:w-4" />
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <SkeletonLine className="h-3 w-16" />
          <SkeletonLine className="h-3 w-20" />
        </div>
      </Card.Content>
    </Card>
  );
}

const barHeights = ['18%', '42%', '24%', '68%', '34%', '12%', '56%', '28%'];

export function DeckCardSkeleton() {
  return (
    <Card className="flex h-full w-full flex-col border border-default-200 shadow-sm">
      <Card.Header className="flex items-start justify-between gap-3 pb-2">
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonLine className="h-6 w-4/5" />
          <SkeletonLine className="h-4 w-full" />
          <SkeletonLine className="h-4 w-3/5" />
        </div>
        <SkeletonBlock className="h-7 w-16 shrink-0 rounded-full" />
      </Card.Header>
      <Card.Content className="flex-1 py-2">
        <div className="space-y-2 rounded-lg bg-default-100 px-3 py-2">
          <SkeletonLine className="h-4 w-full" />
          <SkeletonLine className="h-4 w-5/6" />
        </div>
      </Card.Content>
      <Card.Footer className="pt-2">
        <div className="flex w-full items-start gap-2">
          <SkeletonBlock className="h-8 flex-1 rounded-lg" />
          <SkeletonBlock className="h-8 w-16 rounded-lg" />
          <SkeletonBlock className="h-8 w-9 rounded-lg" />
        </div>
      </Card.Footer>
    </Card>
  );
}

export function DashboardDeckListSkeleton() {
  return (
    <Card>
      <Card.Header className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <SkeletonLine className="h-5 w-28" />
          <SkeletonLine className="h-4 w-80 max-w-full" />
        </div>
        <SkeletonLine className="h-4 w-14" />
      </Card.Header>
      <Card.Content>
        <div className="-mx-6 divide-y divide-default-200">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="px-6 py-4">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <SkeletonBlock className="size-2 shrink-0 rounded-full border-0 shadow-none" />
                    <SkeletonLine className="h-5 w-48 max-w-full" />
                  </div>
                  <SkeletonLine className="h-4 w-full max-w-xl" />
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                  <SkeletonLine className="h-7 w-16 rounded-full" />
                  <SkeletonLine className="h-7 w-14 rounded-full" />
                  <SkeletonLine className="ml-1 hidden h-4 w-8 sm:block" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card.Content>
    </Card>
  );
}
