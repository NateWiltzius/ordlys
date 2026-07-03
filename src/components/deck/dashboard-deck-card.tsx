import { getDeckStudyCountsAction } from '@/server/deck.actions';
import { Deck } from '@/types/deck.types';
import { Card } from '@heroui/react';
import Link from 'next/link';

type Props = {
  deck: Deck;
};

export default async function DashboardDeckCard({ deck }: Props) {
  const stats = await getDeckStudyCountsAction(deck.id);

  return (
    <Link href={`/decks/${deck.id}`} className="w-full">
      <Card className="w-full max-w-sm border border-default-200 shadow-sm transition">
        <Card.Header className="flex items-start justify-between gap-3 pb-2">
          <div className="min-w-0 space-y-1">
            <h3 className="truncate text-lg font-semibold">{deck.title}</h3>
            {deck.description ? (
              <p className="line-clamp-2 text-sm text-default-500">{deck.description}</p>
            ) : (
              <p className="text-sm italic text-default-400">No description</p>
            )}
          </div>
          <div className="flex flex-col gap-1">
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
