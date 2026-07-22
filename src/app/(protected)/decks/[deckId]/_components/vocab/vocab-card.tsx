import { Vocab } from '@/types/vocab.types';
import { ReactNode } from 'react';
import SrsLevelChip from '@/app/(protected)/decks/[deckId]/_components/vocab/srs-level-chip';
import VocabSide from '@/app/(protected)/decks/[deckId]/_components/vocab/vocab-side';
import { getVocabGridColumns } from '@/app/(protected)/decks/[deckId]/_components/vocab/vocab-grid';

type Props = {
  vocab: Vocab;
  index: number;
  actions?: ReactNode;
  srsLevel?: number;
  reviewDueAt?: string;
  showSrsLevel?: boolean;
  frontLabel: string;
  backLabel: string;
};

export default function VocabCard({
  vocab,
  index,
  actions,
  srsLevel,
  reviewDueAt,
  showSrsLevel = false,
  frontLabel,
  backLabel,
}: Props) {
  const desktopColumns = getVocabGridColumns(showSrsLevel, Boolean(actions));

  return (
    <div
      className={`grid gap-4 bg-background px-4 py-4 transition-colors hover:bg-default-50 sm:items-start sm:py-3 ${desktopColumns}`}
    >
      <div className="flex items-center justify-between gap-3 sm:hidden">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          Word {index}
        </span>
        {showSrsLevel ? <SrsLevelChip srsLevel={srsLevel} reviewDueAt={reviewDueAt} /> : null}
      </div>

      <span className="hidden pt-0.5 text-sm tabular-nums text-muted sm:block">{index}</span>

      <VocabSide label={frontLabel} value={vocab.front} alternatives={vocab.frontAlternatives}>
        {vocab.reading ? <p className="text-xs text-muted">Reading: {vocab.reading}</p> : null}
      </VocabSide>

      <VocabSide label={backLabel} value={vocab.back} alternatives={vocab.backAlternatives} />

      {showSrsLevel ? (
        <div className="hidden pt-0.5 sm:block">
          <SrsLevelChip srsLevel={srsLevel} reviewDueAt={reviewDueAt} />
        </div>
      ) : null}

      {actions ? (
        <div className="flex items-center justify-start gap-2 sm:justify-end">{actions}</div>
      ) : null}
    </div>
  );
}
