import DecksContent from '@/app/(protected)/decks/_components/decks-content';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import DecksLoading from '@/app/(protected)/decks/loading';

export const metadata: Metadata = {
  title: 'Library',
  description: 'Open decks you are learning or manage decks you own.',
};

type Props = {
  searchParams: Promise<{ create?: string; import?: string }>;
};

export default async function DeckPage({ searchParams }: Props) {
  const query = await searchParams;
  const initialAction =
    query.create === '1' ? 'create' : query.import === '1' ? 'import' : undefined;

  return (
    <Suspense fallback={<DecksLoading />}>
      <DecksContent initialAction={initialAction} />
    </Suspense>
  );
}
