import { ProgressBar } from '@heroui/react';
import Link from 'next/link';
import ButtonLink from '@/components/shared/button-link';
import EmptyState from '@/components/shared/empty-state';
import PageSection from '@/components/shared/layout/page-section';
import { SRS_CATEGORIES } from '@/lib/srs/srs-config';
import { SRS_CATEGORY_STYLES } from '@/lib/srs/srs-styles';
import { STUDY_TONE_STYLES } from '@/lib/study-colors';
import type { ProgressDeck } from '@/types/progress.types';

type Props = {
  decks: ProgressDeck[];
};

export default function ProgressDeckList({ decks }: Props) {
  return (
    <PageSection
      title="Deck progress"
      description="Coverage, memory strength, and recent accuracy for each active deck."
      contentClassName={decks.length > 0 ? 'divide-y divide-default-200' : undefined}
    >
      {decks.length === 0 ? (
        <EmptyState
          title="No active decks yet"
          description="Add a deck to your library to start building progress."
          action={<ButtonLink href="/discover">Discover decks</ButtonLink>}
        />
      ) : (
        decks.map(deck => {
          const startedPercentage =
            deck.totalWords === 0 ? 0 : Math.round((deck.startedWords / deck.totalWords) * 100);
          const strongWords =
            deck.srsCategoryCounts.strong +
            deck.srsCategoryCounts.mature +
            deck.srsCategoryCounts.mastered;
          const recentAccuracy =
            deck.recentAttempts === 0
              ? null
              : Math.round((deck.recentCorrectAttempts / deck.recentAttempts) * 100);

          return (
            <article key={deck.id} className="py-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-base font-semibold">
                      <Link
                        href={`/decks/${deck.id}`}
                        className="rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        {deck.title}
                      </Link>
                    </h3>
                    {deck.reviewsDue > 0 ? (
                      <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                        {deck.reviewsDue} due
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <ProgressBar
                      aria-label={`${deck.title}: ${deck.startedWords} of ${deck.totalWords} words started`}
                      value={startedPercentage}
                      size="sm"
                      className="min-w-0 flex-1"
                    >
                      <ProgressBar.Track>
                        <ProgressBar.Fill className={STUDY_TONE_STYLES.learning.progress} />
                      </ProgressBar.Track>
                    </ProgressBar>
                    <span className="shrink-0 text-xs font-medium tabular-nums text-default-500">
                      {startedPercentage}%
                    </span>
                  </div>

                  {deck.startedWords > 0 ? (
                    <div
                      className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-default-100"
                      aria-label={`Memory strength across ${deck.startedWords} words in ${deck.title}`}
                    >
                      {SRS_CATEGORIES.map(category => {
                        const count = deck.srsCategoryCounts[category.key];
                        if (count === 0) return null;

                        return (
                          <span
                            key={category.key}
                            className={SRS_CATEGORY_STYLES[category.key].bar}
                            style={{ width: `${(count / deck.startedWords) * 100}%` }}
                            title={`${category.label}: ${count}`}
                          />
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                <dl className="grid grid-cols-3 gap-2 lg:w-[22rem]">
                  <div className="rounded-lg bg-default-100 px-3 py-2">
                    <dt className="text-xs text-default-500">Started</dt>
                    <dd className="mt-1 font-semibold tabular-nums">
                      {deck.startedWords}
                      <span className="font-normal text-default-400">/{deck.totalWords}</span>
                    </dd>
                  </div>
                  <div className="rounded-lg bg-default-100 px-3 py-2">
                    <dt className="text-xs text-default-500">Strong+</dt>
                    <dd className="mt-1 font-semibold tabular-nums">{strongWords}</dd>
                  </div>
                  <div className="rounded-lg bg-default-100 px-3 py-2">
                    <dt className="text-xs text-default-500">28-day accuracy</dt>
                    <dd className="mt-1 font-semibold tabular-nums">
                      {recentAccuracy === null ? '—' : `${recentAccuracy}%`}
                    </dd>
                  </div>
                </dl>

                <ButtonLink
                  href={`/decks/${deck.id}`}
                  variant="secondary"
                  size="sm"
                  className="w-full shrink-0 lg:w-auto"
                >
                  Open deck
                  <span className="sr-only"> {deck.title}</span>
                </ButtonLink>
              </div>
            </article>
          );
        })
      )}
    </PageSection>
  );
}
