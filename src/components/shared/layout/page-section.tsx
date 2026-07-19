import { cn } from '@heroui/react';
import type { ReactNode } from 'react';

type Props = {
  title: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  tone?: 'default' | 'danger';
};

export default function PageSection({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
  tone = 'default',
}: Props) {
  return (
    <section
      className={cn(
        'border-t pt-6',
        tone === 'danger' ? 'border-danger/40' : 'border-default-200',
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className={cn('text-lg font-semibold', tone === 'danger' && 'text-danger')}>
            {title}
          </h2>
          {description ? (
            <p className="mt-1 max-w-3xl text-sm leading-6 text-default-500">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children ? <div className={cn('mt-4', contentClassName)}>{children}</div> : null}
    </section>
  );
}
