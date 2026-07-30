import EmptyState from '@/components/shared/empty-state';
import VocabCard from '@/app/(protected)/decks/[deckId]/_components/vocab/vocab-card';
import { Vocab } from '@/types/vocab.types';
import { ReactNode } from 'react';
import { getVocabGridColumns } from '@/app/(protected)/decks/[deckId]/_components/vocab/vocab-grid';

type Props = {
  vocabs: Vocab[];
  emptyTitle?: string;
  emptyDescription?: string;
  renderActions?: (vocab: Vocab, index: number) => ReactNode;
  srsStates?: Record<number, { srsLevel: number; dueAt: string }>;
  showSrsLevels?: boolean;
  frontLabel?: string;
  backLabel?: string;
  highlightedVocabId?: number | null;
};

export default function VocabTable({
  vocabs,
  emptyTitle = 'No cards yet',
  emptyDescription,
  renderActions,
  srsStates = {},
  showSrsLevels = false,
  frontLabel = 'Front',
  backLabel = 'Back',
  highlightedVocabId,
}: Props) {
  if (vocabs.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  const desktopColumns = getVocabGridColumns(showSrsLevels, Boolean(renderActions));

  return (
    <div className="overflow-hidden rounded-lg border border-default-200">
      <div
        className={`hidden gap-4 border-b border-default-200 bg-default-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted sm:grid sm:items-center ${desktopColumns}`}
      >
        <span>#</span>
        <span>{frontLabel}</span>
        <span>{backLabel}</span>
        {showSrsLevels ? <span>Progress</span> : null}
        {renderActions ? <span className="sr-only">Actions</span> : null}
      </div>
      <div className="divide-y divide-default-200">
        {vocabs.map((vocab, index) => (
          <VocabCard
            key={vocab.id}
            vocab={vocab}
            index={index + 1}
            actions={renderActions?.(vocab, index)}
            srsLevel={srsStates[vocab.id]?.srsLevel}
            reviewDueAt={srsStates[vocab.id]?.dueAt}
            showSrsLevel={showSrsLevels}
            frontLabel={frontLabel}
            backLabel={backLabel}
            isHighlighted={highlightedVocabId === vocab.id}
          />
        ))}
      </div>
    </div>
  );
}
