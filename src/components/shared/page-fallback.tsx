import type { ReactNode } from 'react';

type Props = {
  label: string;
  title: string;
  description: string;
  actions: ReactNode;
};

export default function PageFallback({ label, title, description, actions }: Props) {
  return (
    <section className="mx-auto my-10 w-full max-w-xl border-y border-default-200 px-4 py-10 text-center sm:my-16 sm:px-6 sm:py-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-default-500">{label}</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-default-500 sm:text-base">{description}</p>
      <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
        {actions}
      </div>
    </section>
  );
}
