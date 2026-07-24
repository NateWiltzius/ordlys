import ButtonLink from '@/components/shared/button-link';
import PageFallback from '@/components/shared/page-fallback';
import PageShell from '@/components/shared/layout/page-shell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page not found',
};

export default function NotFound() {
  return (
    <PageShell>
      <PageFallback
        label="404"
        title="Page not found"
        description="This page may have moved, been removed, or never existed."
        actions={
          <>
            <ButtonLink href="/" className="w-full sm:w-auto">
              Go home
            </ButtonLink>
            <ButtonLink href="/public/decks" variant="secondary" className="w-full sm:w-auto">
              Browse public decks
            </ButtonLink>
          </>
        }
      />
    </PageShell>
  );
}
