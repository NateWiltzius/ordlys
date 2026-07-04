import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export default function PageShell({ children }: Props) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      {children}
    </div>
  );
}
