import PublicDecks from '@/app/(protected)/decks/_components/public-decks';
import PageHeader from '@/components/shared/layout/page-header';
import { getDiscoverPageDataAction } from '@/server/deck.actions';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Discover',
  description: 'Find public flashcard decks to follow or copy.',
};

export default async function DiscoverPage() {
  const { publicDecks, ownedDeckIds, followingDeckIds } = await getDiscoverPageDataAction();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Discover"
        description="Find public decks to follow, or make an independent copy you can edit."
      />
      <PublicDecks
        decks={publicDecks}
        ownedDeckIds={ownedDeckIds}
        followingDeckIds={followingDeckIds}
      />
    </div>
  );
}
