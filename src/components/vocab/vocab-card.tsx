import { Vocab } from '@/types/vocab.types';
import { Card } from '@heroui/react';

type Props = {
  vocab: Vocab;
};

export default function VocabCard({ vocab }: Props) {
  return (
    <Card className="inline-flex w-fit max-w-[400px] border border-default-200 bg-default-50/50 shadow-none">
      <div className="space-y-1 px-3 py-2">
        <p className="text-xs font-medium uppercase tracking-wide text-default-500">Front</p>
        <p className="line-clamp-2 text-sm font-medium text-default-800">{vocab.front}</p>
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-default-500">Back</p>
        <p className="line-clamp-2 text-sm text-default-700">{vocab.back}</p>
        {vocab.reading && <p className="text-xs text-default-500">Reading: {vocab.reading}</p>}
      </div>
    </Card>
  );
}
