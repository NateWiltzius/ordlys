import { ReactNode } from 'react';

type Props = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export default function EmptyState({ title, description, action }: Props) {
  return (
    <div className="rounded-lg bg-default-100 px-4 py-6 text-center">
      <p className="font-medium">{title}</p>
      {description ? <p className="mt-1 text-sm text-default-500">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
