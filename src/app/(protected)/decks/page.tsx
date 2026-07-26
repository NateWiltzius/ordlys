import DecksContent from '@/app/(protected)/decks/_components/decks-content';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import DecksLoading from '@/app/(protected)/decks/loading';
import CreateDeckModal from '@/app/(protected)/decks/_components/create-deck-modal';
import ImportDeckModal from '@/app/(protected)/decks/_components/import-deck-modal';
import PageHeader from '@/components/shared/layout/page-header';

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
    <div className="space-y-6">
      <PageHeader
        title="Library"
        description="Open decks you are learning or manage decks you own."
        actions={
          <>
            <ImportDeckModal autoOpen={initialAction === 'import'} />
            <CreateDeckModal autoOpen={initialAction === 'create'} />
          </>
        }
      />
      <Suspense fallback={<DecksLoading showHeader={false} />}>
        <DecksContent />
      </Suspense>
    </div>
  );
}
