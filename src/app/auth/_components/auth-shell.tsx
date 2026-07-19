import type { ReactNode } from 'react';

type Props = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export default function AuthShell({ title, description, children, footer }: Props) {
  return (
    <div className="mx-auto flex min-h-[calc(100svh-4.5rem)] w-full max-w-md items-start px-4 py-6 sm:items-center sm:px-6 sm:py-10">
      <section className="w-full border-y border-default-200 py-6 sm:py-8">
        <header>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mt-1 text-sm leading-6 text-default-500">{description}</p>
        </header>
        <div className="mt-6">{children}</div>
        {footer ? (
          <footer className="mt-6 border-t border-default-200 pt-4 text-center">{footer}</footer>
        ) : null}
      </section>
    </div>
  );
}
