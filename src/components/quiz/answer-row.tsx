import type { AnswerDifferenceSegment } from '@/lib/quiz/answer-difference';

type Props = {
  label: string;
  value: string;
  difference?: AnswerDifferenceSegment;
  differenceTone?: 'correct' | 'incorrect';
  preserveWhitespace?: boolean;
};

export default function AnswerRow({
  label,
  value,
  difference,
  differenceTone,
  preserveWhitespace = false,
}: Props) {
  const differenceClassName =
    differenceTone === 'correct'
      ? 'rounded bg-success/20 px-0.5 text-success'
      : 'rounded bg-danger/20 px-0.5 text-danger';

  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)] sm:gap-4">
      <p className="text-sm text-default-500">{label}</p>
      <p className={`break-words font-medium ${preserveWhitespace ? 'whitespace-pre-wrap' : ''}`}>
        {difference ? (
          <>
            {difference.before}
            {difference.changed ? (
              <mark className={differenceClassName}>{difference.changed}</mark>
            ) : null}
            {difference.after}
          </>
        ) : (
          value
        )}
      </p>
    </div>
  );
}
