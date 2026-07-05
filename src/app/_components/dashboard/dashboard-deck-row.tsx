import { Deck } from '@/types/deck.types';
import { ReviewCounts } from '@/types/review.types';
import { Chip } from '@heroui/react';
import Link from 'next/link';

type Props = {
  deck: Deck;
  stats: Pick<ReviewCounts, 'totalWords' | 'reviewsDue'>;
};

export default function DashboardDeckRow({ deck, stats }: Props) {
  const hasReviewsDue = stats.reviewsDue > 0;

  return (
    <Link
      href={`/decks/${deck.id}`}
      className="group block px-6 py-4 transition hover:bg-default-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={`size-2 shrink-0 rounded-full ${
                hasReviewsDue ? 'bg-success' : 'bg-default-300'
              }`}
            />

            <h3 className="truncate text-base font-semibold text-default-900">{deck.title}</h3>
          </div>

          {deck.description ? (
            <p className="line-clamp-2 text-sm leading-6 text-default-500">{deck.description}</p>
          ) : (
            <p className="text-sm italic text-default-400">No description</p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          <Chip variant="primary" size="sm">
            {stats.totalWords} cards
          </Chip>

          <Chip variant="soft" size="sm" color={hasReviewsDue ? 'success' : 'default'}>
            {stats.reviewsDue} due
          </Chip>

          <span className="ml-1 text-sm font-medium text-primary opacity-0 transition group-hover:opacity-100">
            Open
          </span>
        </div>
      </div>
    </Link>
  );
}
