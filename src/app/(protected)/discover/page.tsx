import PublicDecks from '@/app/(protected)/decks/_components/public-decks';
import PageHeader from '@/components/shared/layout/page-header';
import { getDiscoverPageData } from '@/server/data/deck-page-data';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import DiscoverLoading from '@/app/(protected)/discover/loading';

export const metadata: Metadata = {
  title: 'Discover',
  description: 'Find public flashcard decks to follow or copy.',
};

export default function DiscoverPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Discover"
        description="Find public decks to follow, or make an independent copy you can edit."
      />
      <Suspense fallback={<DiscoverLoading showHeader={false} />}>
        <DiscoverDecks />
      </Suspense>
    </div>
  );
}

async function DiscoverDecks() {
  const { publicDecks, ownedDeckIds, followingDeckIds } = await getDiscoverPageData();

  return (
    <PublicDecks
      decks={publicDecks}
      ownedDeckIds={ownedDeckIds}
      followingDeckIds={followingDeckIds}
    />
  );
}
