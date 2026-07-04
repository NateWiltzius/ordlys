import { Deck } from '@/types/deck.types';
import { ReviewCounts } from '@/types/review.types';
import { Card } from '@heroui/react';
import Link from 'next/link';

type Props = {
  deck: Deck;
  stats: Pick<ReviewCounts, 'totalWords' | 'reviewsDue'>;
};

export default function DashboardDeckCard({ deck, stats }: Props) {
  return (
    <Link href={`/decks/${deck.id}`} className="block min-w-0 max-w-full">
      <Card className="min-w-0 max-w-full border border-default-200 shadow-sm transition">
        <Card.Header className="flex min-w-0 flex-col items-start gap-3 pb-2 sm:flex-row sm:justify-between">
          <div className="min-w-0 max-w-full space-y-1">
            <h3 className="break-words text-lg font-semibold">{deck.title}</h3>
            {deck.description ? (
              <p className="line-clamp-2 break-words text-sm text-default-500">
                {deck.description}
              </p>
            ) : (
              <p className="text-sm italic text-default-400">No description</p>
            )}
          </div>
          <div className="flex shrink-0 gap-3 sm:flex-col sm:gap-1">
            <p className="text-sm text-default-500">
              <span className="font-semibold text-default-700">{stats.totalWords}</span> cards
            </p>
            <p className="text-sm text-default-500">
              <span className="font-semibold text-default-700">{stats.reviewsDue}</span> due
            </p>
          </div>
        </Card.Header>
      </Card>
    </Link>
  );
}
