import type { ReviewDeckDueCount } from '@/types/review.types';

type Props = {
  decks: ReviewDeckDueCount[];
};

export default function ReviewDeckBreakdown({ decks }: Props) {
  if (decks.length < 2) return null;
  const totalDue = decks.reduce((total, deck) => total + deck.count, 0);

  return (
    <section className="rounded-xl border border-default-200 bg-default-50 px-4 py-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 className="font-medium">Reviews by deck</h2>
        <p className="text-sm text-default-500">
          {totalDue} due across {decks.length} decks
        </p>
      </div>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {decks.map(deck => (
          <li
            key={deck.deckId}
            className="flex min-w-0 items-center justify-between gap-3 rounded-lg bg-default-100 px-3 py-2"
          >
            <span className="truncate text-sm font-medium">{deck.deckTitle}</span>
            <span className="shrink-0 text-sm tabular-nums text-default-500">{deck.count} due</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
