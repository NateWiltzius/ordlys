import type { ReactNode } from 'react';

type Props = {
  label: string;
  value: string;
  preserveWhitespace?: boolean;
  language?: string | null;
  action?: ReactNode;
};

export default function AnswerRow({
  label,
  value,
  preserveWhitespace = false,
  language,
  action,
}: Props) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)] sm:gap-4">
      <p className="text-sm text-default-500">{label}</p>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <p
          className={`min-w-0 break-words font-medium ${preserveWhitespace ? 'whitespace-pre-wrap' : ''}`}
          lang={language ?? undefined}
        >
          {value}
        </p>
        {action}
      </div>
    </div>
  );
}
