import { Card } from '@heroui/react';
import { ReactNode } from 'react';

type Props = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
};

export default function PageHeader({ title, description, actions, children }: Props) {
  return (
    <Card className="w-full">
      <Card.Header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          {title ? <h1 className="text-2xl font-semibold tracking-tight">{title}</h1> : null}
          {description ? <p className="text-sm text-default-500">{description}</p> : null}
        </div>

        {actions ? (
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">
            {actions}
          </div>
        ) : null}
      </Card.Header>

      {children ? (
        <Card.Content className="pt-0">
          <div className="flex flex-wrap gap-2">{children}</div>
        </Card.Content>
      ) : null}
    </Card>
  );
}
