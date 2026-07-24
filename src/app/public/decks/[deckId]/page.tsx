import ButtonLink from '@/components/shared/button-link';
import PageShell from '@/components/shared/layout/page-shell';
import {
  getCachedPublicDeckPageData,
  getCachedPublicDeckSitemapEntries,
  getCachedPublicDeckSummaryById,
} from '@/db/queries/public-deck.queries';
import { formatLanguagePair } from '@/lib/languages';
import { OPEN_GRAPH_IMAGE, TWITTER_IMAGE } from '@/lib/site';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { Card, Chip } from '@heroui/react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import DeckIdentity from '@/components/shared/deck-identity';
import PublicDeckActions from '@/app/public/decks/[deckId]/_components/public-deck-actions';
import CollapsibleSection from '@/components/shared/collapsible-section';

type Props = {
  params: Promise<{ deckId: string }>;
};

export const revalidate = 3600;

export async function generateStaticParams() {
  const decks = await getCachedPublicDeckSitemapEntries();
  return decks.map(deck => ({ deckId: String(deck.id) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const deckId = parsePositiveInteger((await params).deckId);
  if (!deckId) return missingDeckMetadata;

  const deck = await getCachedPublicDeckSummaryById(deckId);
  if (!deck) return missingDeckMetadata;

  const description = deckDescription(deck);
  const canonical = `/public/decks/${deck.id}`;

  return {
    title: deck.title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: canonical,
      siteName: 'Ordlys',
      title: deck.title,
      description,
      images: [OPEN_GRAPH_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: deck.title,
      description,
      images: [TWITTER_IMAGE],
    },
    robots: deck.visibility === 'public' ? undefined : { index: false, follow: false },
  };
}

export default async function PublicDeckPage({ params }: Props) {
  const deckId = parsePositiveInteger((await params).deckId);
  if (!deckId) notFound();

  const deck = await getCachedPublicDeckPageData(deckId);
  if (!deck) notFound();

  const appDeckPath = `/decks/${deck.id}`;
  const languagePair = formatLanguagePair(deck.frontLanguage, deck.backLanguage);

  return (
    <PageShell>
      <nav aria-label="Breadcrumb" className="text-sm text-default-500">
        <Link href="/public/decks" className="hover:text-primary hover:underline">
          Public decks
        </Link>{' '}
        <span aria-hidden="true">/</span> <span>{deck.title}</span>
      </nav>

      <header className="py-2 sm:py-4">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:justify-between">
          <div className="max-w-3xl space-y-3">
            <DeckIdentity badges={['public']} languagePair={languagePair} />
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{deck.title}</h1>
            <p className="text-base text-default-600 sm:text-lg">{deckDescription(deck)}</p>
            {deck.provenance ? (
              <p className="text-sm text-default-500">
                Community copy derived from “{deck.provenance.sourceTitle}” release v
                {deck.provenance.sourceVersion}.
              </p>
            ) : null}
          </div>

          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:min-w-56">
            <PublicDeckActions appDeckPath={appDeckPath} placement="header" />
          </div>
        </div>

        <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-3">
          <div>
            <dt className="text-sm text-default-500">Lessons</dt>
            <dd className="text-2xl font-semibold">{deck.lessonCount}</dd>
          </div>
          <div>
            <dt className="text-sm text-default-500">Vocabulary words</dt>
            <dd className="text-2xl font-semibold">{deck.wordCount}</dd>
          </div>
        </dl>
      </header>

      <CollapsibleSection
        id="lesson-outline"
        title="Lesson outline"
        description="Open to see how the vocabulary is organized."
        summary={
          <Chip size="sm" variant="soft">
            {deck.lessonCount} {deck.lessonCount === 1 ? 'lesson' : 'lessons'}
          </Chip>
        }
      >
        {deck.lessons.length > 0 ? (
          <ol className="flex flex-col gap-1">
            {deck.lessons.map((lesson, index) => (
              <li
                key={lesson.id}
                className="flex flex-col gap-2 rounded-lg px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="w-16 shrink-0 pt-0.5 text-xs font-semibold uppercase tracking-wide text-default-500">
                    Lesson {index + 1}
                  </span>
                  <h3 className="min-w-0 font-medium">{lesson.title}</h3>
                </div>
                <Chip size="sm" variant="soft" className="w-fit shrink-0">
                  {lesson.wordCount} {lesson.wordCount === 1 ? 'word' : 'words'}
                </Chip>
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-lg bg-default-100 px-5 py-6 text-default-500">
            This deck does not have any lessons yet.
          </p>
        )}
      </CollapsibleSection>

      {deck.vocabularyPreview.length > 0 ? (
        <section
          aria-labelledby="vocabulary-preview-heading"
          className="border-t border-default-200 pt-6"
        >
          <div>
            <h2 id="vocabulary-preview-heading" className="text-lg font-semibold">
              Vocabulary preview
            </h2>
            <p className="mt-1 text-sm leading-6 text-default-500">
              Showing {deck.vocabularyPreview.length} of {deck.wordCount} words. Create an account
              to study the deck with spaced repetition and save your progress.
            </p>
          </div>

          <div className="mt-4 overflow-x-auto rounded-lg border border-default-200">
            <table className="w-full border-collapse text-left">
              <thead className="bg-default-50 text-sm text-default-500">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Word
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Translation
                  </th>
                  <th scope="col" className="hidden px-4 py-3 font-medium sm:table-cell">
                    Lesson
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-default-200">
                {deck.vocabularyPreview.map(word => (
                  <tr key={word.id}>
                    <td className="px-4 py-3 font-medium" lang={deck.frontLanguage ?? undefined}>
                      {word.front}
                      {word.reading ? (
                        <span className="ml-2 text-sm font-normal text-default-500">
                          {word.reading}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3" lang={deck.backLanguage ?? undefined}>
                      {word.back}
                    </td>
                    <td className="hidden px-4 py-3 text-sm text-default-500 sm:table-cell">
                      {word.lessonTitle}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {deck.communityVariants.length ? (
        <section
          className="border-t border-default-200 pt-6"
          aria-labelledby="community-variants-heading"
        >
          <h2 id="community-variants-heading" className="text-lg font-semibold">
            Community variants
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {deck.communityVariants.map(variant => (
              <Card key={variant.id}>
                <Card.Header>
                  <div>
                    <Card.Title>{variant.title}</Card.Title>
                    <Card.Description>{variant.description || 'No description.'}</Card.Description>
                  </div>
                </Card.Header>
                <Card.Footer>
                  <ButtonLink href={`/public/decks/${variant.id}`} variant="secondary">
                    View variant
                  </ButtonLink>
                </Card.Footer>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <PublicDeckActions appDeckPath={appDeckPath} placement="footer" />
    </PageShell>
  );
}

const missingDeckMetadata: Metadata = {
  title: 'Deck not found',
  robots: { index: false, follow: false },
};

function deckDescription(deck: {
  description: string | null;
  lessonCount: number;
  wordCount: number;
}) {
  return (
    deck.description ||
    `Preview ${deck.wordCount} vocabulary words across ${deck.lessonCount} lessons in this public Ordlys deck.`
  );
}
