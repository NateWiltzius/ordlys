import ButtonLink from '@/components/shared/button-link';
import PageShell from '@/components/shared/layout/page-shell';
import { getCachedPublicDeckSummaries } from '@/db/queries/public-deck.queries';
import { OPEN_GRAPH_IMAGE, TWITTER_IMAGE } from '@/lib/site';
import type { Metadata } from 'next';
import PublicDeckBrowser from '@/app/public/decks/_components/public-deck-browser';
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

async function PublicDeckResults() {
  const decks = await getCachedPublicDeckSummaries();

  return decks.length > 0 ? (
    <section aria-labelledby="available-decks-heading" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="available-decks-heading" className="text-2xl font-semibold">
            Available decks
          </h2>
          <p className="mt-1 text-sm text-default-500">
            Preview any deck without an account. An account is required to study and save progress.
          </p>
        </div>
        <ButtonLink href="/auth/sign-up" size="sm">
          Create an account
        </ButtonLink>
      </div>
      <PublicDeckBrowser decks={decks} />
    </section>
  ) : (
    <section className="rounded-xl border border-default-200 bg-default-50 px-6 py-10 text-center">
      <h2 className="text-xl font-semibold">Public decks are coming soon</h2>
      <p className="mt-2 text-default-500">
        Create an account to build your own vocabulary decks in the meantime.
      </p>
      <ButtonLink href="/auth/sign-up" className="mt-5">
        Start learning
      </ButtonLink>
    </section>
  );
}

function PublicDecksLoading() {
  return (
    <section className="space-y-4" role="status" aria-label="Loading public decks" aria-busy="true">
      <span className="sr-only">Loading public decks…</span>
      <div className="h-16 w-full max-w-xl animate-pulse rounded-xl bg-default-100" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="h-52 animate-pulse rounded-xl border border-default-200 bg-default-100"
          />
        ))}
      </div>
    </section>
  );
}
