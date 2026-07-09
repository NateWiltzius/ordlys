import { Vocab } from '@/types/vocab.types';
import { ReactNode } from 'react';
import SrsLevelChip from '@/app/(protected)/decks/[deckId]/_components/vocab/srs-level-chip';
import VocabSide from '@/app/(protected)/decks/[deckId]/_components/vocab/vocab-side';

type Props = {
  vocab: Vocab;
  index: number;
  actions?: ReactNode;
  srsLevel?: number;
  showSrsLevel?: boolean;
};

export default function VocabCard({
  vocab,
  index,
  actions,
  srsLevel,
  showSrsLevel = false,
}: Props) {
  return (
    <div
      className={`grid gap-3 bg-background px-4 py-3 transition-colors hover:bg-default-50 sm:gap-4 items-center ${
        actions
          ? 'sm:grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)_12rem]'
          : 'sm:grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)]'
      }`}
    >
      <span className="hidden text-sm tabular-nums text-default-400 sm:block">{index}</span>

      <VocabSide label="Front" value={vocab.front} alternatives={vocab.frontAlternatives}>
        {showSrsLevel ? <SrsLevelChip srsLevel={srsLevel} /> : null}
        {vocab.reading ? (
          <p className="text-xs text-default-500">Reading: {vocab.reading}</p>
        ) : null}
      </VocabSide>

      <VocabSide label="Back" value={vocab.back} alternatives={vocab.backAlternatives} />

      {actions ? (
        <div className="flex items-center justify-start sm:justify-end gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
