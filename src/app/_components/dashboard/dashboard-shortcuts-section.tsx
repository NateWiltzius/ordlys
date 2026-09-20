import ButtonLink from '@/components/shared/button-link';
import type { ReactNode } from 'react';

export default function DashboardShortcutsSection({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-xl border border-default-200 bg-default-50/50 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-medium text-default-600">Deck shortcuts</h2>
        <ButtonLink href="/decks" variant="tertiary" size="sm">
          View library
        </ButtonLink>
      </div>
      <div className="mt-4 divide-y divide-default-200">{children}</div>
    </section>
  );
}
