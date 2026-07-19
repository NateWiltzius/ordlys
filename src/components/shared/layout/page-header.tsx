import { cn } from '@heroui/react';
import { ReactNode } from 'react';

type Props = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
  contentClassName?: string;
};

export default function PageHeader({
  title,
  description,
  actions,
  children,
  contentClassName,
}: Props) {
  return (
    <header className="w-full py-1">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          {title ? <h1 className="break-words text-2xl font-semibold">{title}</h1> : null}

          {description ? (
            <p className="max-w-3xl text-sm leading-6 text-default-500">{description}</p>
          ) : null}
        </div>

        {actions ? (
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0 sm:justify-end sm:pt-0.5">
            {actions}
          </div>
        ) : null}
      </div>

      {children ? (
        <div className={cn('mt-4 flex flex-wrap gap-2', contentClassName)}>{children}</div>
      ) : null}
    </header>
  );
}
