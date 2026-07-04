import EmptyState from '@/components/shared/empty-state';
import VocabCard from '@/components/vocab/vocab-card';
import { Vocab } from '@/types/vocab.types';
import { ReactNode } from 'react';

type Props = {
  vocabs: Vocab[];
  emptyTitle?: string;
  emptyDescription?: string;
  renderActions?: (vocab: Vocab, index: number) => ReactNode;
  srsLevels?: Record<number, number>;
  showSrsLevels?: boolean;
};

export default function VocabTable({
  vocabs,
  emptyTitle = 'No words yet',
  emptyDescription,
  renderActions,
  srsLevels = {},
  showSrsLevels = false,
}: Props) {
  if (vocabs.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-default-200">
      <div
        className={`hidden gap-4 border-b border-default-200 bg-default-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-default-500 sm:grid ${
          renderActions
            ? 'grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)_auto]'
            : 'grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)]'
        }`}
      >
        <span>#</span>
        <span>Front</span>
        <span>Back</span>
        {renderActions ? <span className="sr-only">Actions</span> : null}
      </div>
      <div className="divide-y divide-default-200">
        {vocabs.map((vocab, index) => (
          <VocabCard
            key={vocab.id}
            vocab={vocab}
            index={index + 1}
            actions={renderActions?.(vocab, index)}
            srsLevel={srsLevels[vocab.id]}
            showSrsLevel={showSrsLevels}
          />
        ))}
      </div>
    </div>
  );
}
