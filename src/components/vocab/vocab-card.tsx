import { Vocab } from '@/types/vocab.types';
import { ReactNode } from 'react';

type Props = {
  vocab: Vocab;
  index: number;
  actions?: ReactNode;
};

export default function VocabCard({ vocab, index, actions }: Props) {
  return (
    <div
      className={`grid gap-3 bg-background px-4 py-3 transition-colors hover:bg-default-50 sm:gap-4 ${
        actions
          ? 'sm:grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)_auto]'
          : 'sm:grid-cols-[3rem_minmax(0,1fr)_minmax(0,1fr)]'
      }`}
    >
      <span className="hidden self-center text-sm tabular-nums text-default-400 sm:block">
        {index}
      </span>

      <VocabSide label="Front" value={vocab.front} alternatives={vocab.frontAlternatives}>
        {vocab.reading ? (
          <p className="text-xs text-default-500">Reading: {vocab.reading}</p>
        ) : null}
      </VocabSide>

      <VocabSide label="Back" value={vocab.back} alternatives={vocab.backAlternatives} />

      {actions}
    </div>
  );
}

type VocabSideProps = {
  label: string;
  value: string;
  alternatives: string[];
  children?: React.ReactNode;
};

function VocabSide({ label, value, alternatives, children }: VocabSideProps) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-default-400 sm:hidden">
        {label}
      </p>
      <p className="break-words text-sm font-medium text-default-800">{value}</p>
      {alternatives.length > 0 ? (
        <p className="mt-1 break-words text-xs leading-relaxed text-default-500">
          <span className="font-medium">Also accepts:</span> {alternatives.join(', ')}
        </p>
      ) : null}
      {children ? <div className="mt-1">{children}</div> : null}
    </div>
  );
}
