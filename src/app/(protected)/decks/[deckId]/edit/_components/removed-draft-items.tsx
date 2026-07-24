'use client';

import type { RemovedDraftItem } from '@/db/queries/deck-release.queries';
import { restoreLessonAction } from '@/server/lesson.actions';
import { restoreVocabAction } from '@/server/vocab.actions';
import { Button } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import StatusAlert from '@/components/shared/status-alert';
import { isActionFailure } from '@/lib/action-result';
import PageSection from '@/components/shared/layout/page-section';

type Props = {
  items: RemovedDraftItem[];
};

export default function RemovedDraftItems({ items }: Props) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (!items.length) return null;
  async function restore(item: RemovedDraftItem) {
    try {
      setPendingId(item.id);
      setError(null);
      const result =
        item.kind === 'lesson'
          ? await restoreLessonAction(item.id)
          : await restoreVocabAction(item.id);
      if (isActionFailure(result)) {
        setError(result.message);
        return;
      }
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not restore the draft item.');
    } finally {
      setPendingId(null);
    }
  }
  return (
    <PageSection
      title="Removed content"
      description="Restore lessons or words before the next publish while keeping existing learner progress connected."
    >
      <div className="divide-y divide-default-200 border-y border-default-200">
        {items.map(item => (
          <div
            key={`${item.kind}-${item.id}`}
            className="flex items-center justify-between gap-3 py-3"
          >
            <span className="text-sm">
              <span className="capitalize">{item.kind}</span>: {item.label}
            </span>
            <Button
              size="sm"
              variant="secondary"
              isPending={pendingId === item.id}
              onPress={() => restore(item)}
            >
              Restore
            </Button>
          </div>
        ))}
        {error ? <StatusAlert status="danger">{error}</StatusAlert> : null}
      </div>
    </PageSection>
  );
}
