import FeaturedPublicDecks from '@/app/_components/featured-public-decks';
import FeaturedPublicDecksLoading from '@/app/_components/featured-public-decks-loading';
import ButtonLink from '@/components/shared/button-link';
import HomepageQuizPreview from '@/app/_components/homepage-quiz-preview';
import { absoluteUrl, OPEN_GRAPH_IMAGE, TWITTER_IMAGE } from '@/lib/site';
import { Chip } from '@heroui/react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

const title = 'Ordlys – Norwegian Vocabulary and Language Flashcard Decks';
const description =
  'Start with ready-made Norwegian decks from A1 to C2 and the full course vocabulary collection, or create and share spaced-repetition decks for any language.';

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
            Norwegian-first, built for any language
          </Chip>

          <div className="space-y-3">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Learn Norwegian vocabulary. Remember it when you need it.
            </h1>
            <p className="max-w-2xl text-lg text-default-500">
              Start with ready-made Norwegian decks from A1 to C2 and a vocabulary collection
              covering the full Duolingo Norwegian course, or create and share spaced-repetition
              decks for any language.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/auth/sign-up" size="lg">
              Start learning Norwegian
            </ButtonLink>
            <ButtonLink href="/public/decks" variant="secondary" size="lg">
              Browse shared decks
            </ButtonLink>
          </div>
        </div>

        <HomepageQuizPreview />
      </section>

      <section aria-labelledby="public-decks-heading" className="mt-16 space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Built to be shared
            </p>
            <h2 id="public-decks-heading" className="mt-2 text-3xl font-semibold tracking-tight">
              Explore Norwegian decks from the community
            </h2>
            <p className="mt-2 text-default-500">
              Preview lessons and sample words without an account. Follow a deck to study it, or
              create and share a collection that other learners can use.
            </p>
          </div>
          <ButtonLink href="/public/decks" variant="secondary">
            Explore Norwegian decks
          </ButtonLink>
        </div>

        <Suspense fallback={<FeaturedPublicDecksLoading />}>
          <FeaturedPublicDecks />
        </Suspense>
      </section>

      <section aria-labelledby="how-it-works-heading" className="mt-16 border-y border-default-200">
        <div className="py-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            A simple study rhythm
          </p>
          <h2 id="how-it-works-heading" className="mt-2 text-2xl font-semibold tracking-tight">
            Choose, study, review
          </h2>
        </div>

        <ol className="grid border-t border-default-200 md:grid-cols-3">
          <li className="py-7 pr-6 md:py-8">
            <p className="text-sm font-semibold text-primary">01</p>
            <h3 className="mt-2 text-lg font-semibold">Choose or create a deck</h3>
            <p className="mt-2 text-sm leading-6 text-default-500">
              Start with Norwegian, follow a shared collection, or build something for any language.
            </p>
          </li>
          <li className="border-t border-default-200 py-7 md:border-t-0 md:border-l md:px-6 md:py-8">
            <p className="text-sm font-semibold text-primary">02</p>
            <h3 className="mt-2 text-lg font-semibold">Study both directions</h3>
            <p className="mt-2 text-sm leading-6 text-default-500">
              Practise recognizing words and producing the answer yourself.
            </p>
          </li>
          <li className="border-t border-default-200 py-7 md:border-t-0 md:border-l md:py-8 md:pl-6">
            <p className="text-sm font-semibold text-primary">03</p>
            <h3 className="mt-2 text-lg font-semibold">Review when it matters</h3>
            <p className="mt-2 text-sm leading-6 text-default-500">
              Ordlys schedules each card and brings it back when it is worth reviewing.
            </p>
          </li>
        </ol>
      </section>

      <aside className="mx-auto mt-12 max-w-2xl text-center text-sm leading-6 text-default-500">
        Ordlys is an independent project, shaped by feedback from language learners.{' '}
        <Link href="/feedback" className="font-medium text-primary underline">
          Share your feedback
        </Link>
        .
      </aside>
    </div>
  );
}
