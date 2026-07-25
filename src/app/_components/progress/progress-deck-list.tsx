import Link from 'next/link';
import ButtonLink from '@/components/shared/button-link';
import EmptyState from '@/components/shared/empty-state';
import PageSection from '@/components/shared/layout/page-section';
import { SRS_CATEGORIES } from '@/lib/srs/srs-config';
import { SRS_CATEGORY_STYLES } from '@/lib/srs/srs-styles';
import { STUDY_TONE_STYLES } from '@/lib/study-colors';
import type { ProgressDeck } from '@/types/progress.types';
import DeckCoverage from '@/components/shared/deck-coverage';
import DeckWorkload from '@/components/shared/deck-workload';

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
                    <DeckWorkload
                      reviewsDue={deck.reviewsDue}
                      newWordsAvailable={deck.newWordsAvailable}
                    />
                  </div>

                  <DeckCoverage
                    started={deck.startedWords}
                    total={deck.totalWords}
                    deckTitle={deck.title}
                    className="mt-3"
                  />

                  {deck.startedWords > 0 ? (
                    <div
                      className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-default-100"
                      aria-label={`Memory strength across ${deck.startedWords} cards in ${deck.title}`}
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

                <dl className="grid grid-cols-2 gap-2 lg:w-[15rem]">
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

                {deck.reviewsDue > 0 ? (
                  <ButtonLink
                    href={`/decks/${deck.id}/review`}
                    size="sm"
                    className={`w-full shrink-0 lg:w-auto ${STUDY_TONE_STYLES.review.button}`}
                  >
                    Review
                    <span className="sr-only"> in {deck.title}</span>
                  </ButtonLink>
                ) : deck.newWordsAvailable > 0 ? (
                  <ButtonLink
                    href={`/decks/${deck.id}/learn`}
                    size="sm"
                    className={`w-full shrink-0 lg:w-auto ${STUDY_TONE_STYLES.learning.button}`}
                  >
                    Learn
                    <span className="sr-only"> in {deck.title}</span>
                  </ButtonLink>
                ) : (
                  <ButtonLink
                    href={`/decks/${deck.id}`}
                    variant="secondary"
                    size="sm"
                    className="w-full shrink-0 lg:w-auto"
                  >
                    Open deck
                    <span className="sr-only"> {deck.title}</span>
                  </ButtonLink>
                )}
              </div>
            </article>
          );
        })
      )}
    </PageSection>
  );
}
