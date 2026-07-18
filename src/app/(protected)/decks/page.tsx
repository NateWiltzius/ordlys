import DecksContent from '@/app/(protected)/decks/_components/decks-content';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import DecksLoading from '@/app/(protected)/decks/loading';

export const metadata: Metadata = {
  title: 'Library',
  description: 'Open decks you are learning or manage decks you own.',
};

export default function DeckPage() {
  return (
    <Suspense fallback={<DecksLoading />}>
      <DecksContent />
    </Suspense>
  );
}
