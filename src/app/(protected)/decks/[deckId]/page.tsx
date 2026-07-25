import DeckContent from '@/app/(protected)/decks/[deckId]/_components/deck-content';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import DeckLoading from '@/app/(protected)/decks/[deckId]/loading';

export const metadata: Metadata = {
  title: 'Deck',
  description: 'Study cards, review progress, and browse deck lessons.',
};

type Props = {
  params: Promise<{
    deckId: string;
  }>;
  searchParams: Promise<{
    follow?: string;
  }>;
};

export default async function DeckPage({ params, searchParams }: Props) {
  const [{ deckId }, query] = await Promise.all([params, searchParams]);
  const parsedDeckId = parsePositiveInteger(deckId);
  if (!parsedDeckId) notFound();

  return (
    <Suspense fallback={<DeckLoading />}>
      <DeckContent deckId={parsedDeckId} autoFollow={query.follow === '1'} />
    </Suspense>
  );
}
