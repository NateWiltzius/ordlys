import PublicDeckResults from '@/app/public/decks/_components/public-deck-results';
import PublicDecksLoading from '@/app/public/decks/_components/public-decks-loading';
import PageShell from '@/components/shared/layout/page-shell';
import { OPEN_GRAPH_IMAGE, TWITTER_IMAGE } from '@/lib/site';
import type { Metadata } from 'next';
import { Suspense } from 'react';

const title = 'Public language-learning flashcard decks';
const description =
  'Browse public vocabulary decks, preview their lessons and words, and create an Ordlys account when you are ready to study.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/public/decks' },
  openGraph: {
    type: 'website',
    url: '/public/decks',
    siteName: 'Ordlys',
    title,
    description,
    images: [OPEN_GRAPH_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [TWITTER_IMAGE],
  },
};

export default function PublicDecksPage() {
  return (
    <PageShell>
      <header className="space-y-4 py-4 sm:py-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Deck library</p>
        <div className="max-w-3xl space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          <p className="text-lg text-default-500">{description}</p>
        </div>
      </header>

      <Suspense fallback={<PublicDecksLoading />}>
        <PublicDeckResults />
      </Suspense>
    </PageShell>
  );
}
