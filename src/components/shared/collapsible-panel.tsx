import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { cn } from '@heroui/react';
import type { ReactNode } from 'react';

type Props = {
  title: ReactNode;
  description?: ReactNode;
  summary?: ReactNode;
  children: ReactNode;
  open?: boolean;
  id?: string;
  size?: 'compact' | 'section';
  tone?: 'default' | 'warning';
  className?: string;
};

export default function CollapsiblePanel({
  title,
  description,
  summary,
  children,
  open,
  id,
  size = 'compact',
  tone = 'default',
  className,
}: Props) {
  return (
    <details
      id={id}
      open={open}
      className={cn(
        'group/disclosure rounded-xl border',
        tone === 'warning'
          ? 'border-warning/30 bg-warning/5'
          : 'border-default-200 bg-default-50/50',
        className,
      )}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-5 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0">
          {size === 'section' ? (
            <h2 className="text-lg font-semibold">{title}</h2>
          ) : (
            <span className="block text-sm font-medium text-default-600">{title}</span>
          )}
          {description ? (
            <div className="mt-1 text-sm leading-6 text-default-500">{description}</div>
          ) : null}
        </div>
        {summary ? <span className="shrink-0">{summary}</span> : null}
        <ChevronDownIcon
          className="size-5 shrink-0 text-default-400 transition-transform group-open/disclosure:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="px-4 pb-4 sm:px-5 sm:pb-5">{children}</div>
    </details>
  );
}
