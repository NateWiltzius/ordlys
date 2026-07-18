import DeckContent from '@/app/(protected)/decks/[deckId]/_components/deck-content';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import DeckLoading from '@/app/(protected)/decks/[deckId]/loading';

export const metadata: Metadata = {
  title: 'Deck',
  description: 'Study vocabulary, review progress, and browse deck lessons.',
};

type Props = {
  params: Promise<{
    deckId: string;
  }>;
};

export default async function DeckPage({ params }: Props) {
  const { deckId } = await params;
  const parsedDeckId = parsePositiveInteger(deckId);
  if (!parsedDeckId) notFound();

  return (
    <Suspense fallback={<DeckLoading />}>
      <DeckContent deckId={parsedDeckId} />
    </Suspense>
  );
}
