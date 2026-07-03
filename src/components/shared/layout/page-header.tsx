import { ReactNode } from 'react';

type Props = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
};

export default function PageHeader({ title, description, actions, children }: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-default-200 bg-white/70 p-5 shadow-sm backdrop-blur-sm dark:bg-default-50/70">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          {title ? <h1 className="text-2xl font-semibold tracking-tight">{title}</h1> : null}
          {description ? <p className="text-sm text-default-500">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}
