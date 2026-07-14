import FeatureCard from '@/app/_components/feature-card';
import PublicDeckCard from '@/components/public-deck-card';
import ButtonLink from '@/components/shared/button-link';
import { getCachedPublicDeckSummaries } from '@/db/queries/public-deck.queries';
import { absoluteUrl, OPEN_GRAPH_IMAGE, TWITTER_IMAGE } from '@/lib/site';
import { Card, Chip } from '@heroui/react';
import { STUDY_TONE_STYLES } from '@/lib/study-colors';
import type { Metadata } from 'next';
import { Suspense } from 'react';

const title = 'Ordlys – Spaced Repetition Flashcards for Language Learning';
const description =
  'Build vocabulary decks, learn with active recall, and review words at the right time with Ordlys spaced repetition flashcards.';

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
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

export default function Home() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Ordlys',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    url: absoluteUrl('/'),
    description,
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replaceAll('<', '\\u003c'),
        }}
      />
      <section className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Chip size="sm" variant="soft" color="success">
            Smart flashcards for language learning
          </Chip>

          <div className="space-y-3">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Learn words today. Review them before you forget.
            </h1>
            <p className="max-w-2xl text-lg text-default-500">
              Ordlys helps you build vocabulary decks, study new words, and review them at the right
              time so they actually stick.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/auth/sign-up" size="lg">
              Start learning
            </ButtonLink>
            <ButtonLink href="/public/decks" variant="secondary" size="lg">
              Browse public decks
            </ButtonLink>
          </div>
        </div>

        <Card variant="secondary" className="w-full">
          <Card.Header>
            <h2 className="card__title">Today&apos;s study plan</h2>
            <Card.Description>A simple queue for learning and review.</Card.Description>
          </Card.Header>

          <Card.Content className="space-y-3">
            <div className={`rounded-lg border px-4 py-3 ${STUDY_TONE_STYLES.learning.surface}`}>
              <p className="text-sm text-default-500">Ready to learn</p>
              <p className={`text-2xl font-semibold ${STUDY_TONE_STYLES.learning.text}`}>12</p>
            </div>

            <div className={`rounded-lg border px-4 py-3 ${STUDY_TONE_STYLES.review.surface}`}>
              <p className="text-sm text-default-500">Reviews due</p>
              <p className={`text-2xl font-semibold ${STUDY_TONE_STYLES.review.text}`}>28</p>
            </div>

            <div className="rounded-lg bg-default-100 px-4 py-3">
              <p className="text-sm text-default-500">Active deck</p>
              <p className="font-medium">Norwegian A1 Vocabulary</p>
            </div>
          </Card.Content>
        </Card>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        <FeatureCard
          title="Create decks"
          description="Organize vocabulary by topic, lesson, exam, textbook, or whatever you are learning."
        />
        <FeatureCard
          title="Study both directions"
          description="Practice recognizing words and producing answers so your knowledge is actually usable."
        />
        <FeatureCard
          title="Review on schedule"
          description="Ordlys keeps track of what is due so you can focus on the next useful session."
        />
      </section>

      <section aria-labelledby="public-decks-heading" className="mt-16 space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Try before you sign up
            </p>
            <h2 id="public-decks-heading" className="mt-2 text-3xl font-semibold tracking-tight">
              Preview public vocabulary decks
            </h2>
            <p className="mt-2 text-default-500">
              Browse lesson outlines and sample words without an account. Sign up only when you want
              to study a deck and save your progress.
            </p>
          </div>
          <ButtonLink href="/public/decks" variant="secondary">
            Browse public decks
          </ButtonLink>
        </div>

        <Suspense fallback={<FeaturedPublicDecksLoading />}>
          <FeaturedPublicDecks />
        </Suspense>
      </section>
    </div>
  );
}

async function FeaturedPublicDecks() {
  const publicDecks = await getCachedPublicDeckSummaries(3);

  if (publicDecks.length === 0) {
    return (
      <div className="rounded-xl border border-default-200 bg-default-50 px-6 py-8 text-center">
        <h3 className="text-lg font-semibold">Public decks are coming soon</h3>
        <p className="mt-1 text-default-500">
          You can still create an account and start building your own vocabulary library.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {publicDecks.map(deck => (
        <PublicDeckCard key={deck.id} deck={deck} />
      ))}
    </div>
  );
}

function FeaturedPublicDecksLoading() {
  return (
    <div
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      role="status"
      aria-label="Loading public decks"
      aria-busy="true"
    >
      <span className="sr-only">Loading public decks…</span>
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          className="h-52 animate-pulse rounded-xl border border-default-200 bg-default-100"
        />
      ))}
    </div>
  );
}
