import { Deck } from '@/types/deck.types';
import { ReviewCounts } from '@/types/review.types';
import Link from 'next/link';
import { BookOpenIcon } from '@heroicons/react/24/outline';
import { STUDY_TONE_STYLES } from '@/lib/study-colors';
import ButtonLink from '@/components/shared/button-link';
import DeckCoverage from '@/components/shared/deck-coverage';
import DeckWorkload from '@/components/shared/deck-workload';

type Props = {
  deck: Deck;
  stats: Pick<ReviewCounts, 'totalWords' | 'newWordsAvailable' | 'reviewsDue' | 'wordsInReview'>;
};

export default function DashboardDeckRow({ deck, stats }: Props) {
  const hasReviewsDue = stats.reviewsDue > 0;
  const hasNewWords = stats.newWordsAvailable > 0;
  const introducedCards = Math.min(stats.wordsInReview, stats.totalWords);

  return (
    <div className="py-4">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-default-200 bg-default-100 text-default-600">
            <BookOpenIcon className="size-5" aria-hidden="true" />
          </span>

          <div className="min-w-0 flex-1 space-y-2">
            <h3 className="truncate text-base font-semibold text-default-900">
              <Link
                href={`/decks/${deck.id}`}
                className="rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {deck.title}
              </Link>
            </h3>

            {deck.description ? (
              <p className="line-clamp-2 text-sm leading-6 text-default-500">{deck.description}</p>
            ) : (
              <p className="text-sm italic text-default-400">No description</p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          <DeckWorkload reviewsDue={stats.reviewsDue} newWordsAvailable={stats.newWordsAvailable} />
          {hasReviewsDue ? (
            <ButtonLink
              href={`/decks/${deck.id}/review`}
              size="sm"
              className={STUDY_TONE_STYLES.review.button}
            >
              Review
              <span className="sr-only"> in {deck.title}</span>
            </ButtonLink>
          ) : null}
          {hasNewWords ? (
            <ButtonLink
              href={`/decks/${deck.id}/learn`}
              size="sm"
              className={STUDY_TONE_STYLES.learning.button}
            >
              Learn
              <span className="sr-only"> in {deck.title}</span>
            </ButtonLink>
          ) : null}
          {!hasReviewsDue && !hasNewWords ? (
            <ButtonLink href={`/decks/${deck.id}`} size="sm" variant="secondary">
              Open deck <span className="sr-only">{deck.title}</span>
            </ButtonLink>
          ) : null}
        </div>
      </div>

      <DeckCoverage
        started={introducedCards}
        total={stats.totalWords}
        deckTitle={deck.title}
        className="mt-3"
      />
    </div>
  );
}
