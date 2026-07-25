import PublicDeckCard from '@/components/public-deck-card';
import { getCachedPublicDeckSummaries } from '@/db/queries/public-deck.queries';

export default async function FeaturedPublicDecks() {
  const publicDecks = await getCachedPublicDeckSummaries(undefined, ['nb', 'nn']);
  const preferredTitles = ['Norwegian A1', 'Norwegian A2', 'Duolingo Norwegian Section 1'];
  const preferredDecks = preferredTitles
    .map(title => publicDecks.find(deck => deck.title === title))
    .filter(deck => deck !== undefined);
  const fallbackDecks = publicDecks.filter(deck => !preferredDecks.includes(deck));
  const featuredDecks = [...preferredDecks, ...fallbackDecks].slice(0, 3);

  if (featuredDecks.length === 0) {
    return (
      <div className="rounded-xl border border-default-200 bg-default-50 px-6 py-8 text-center">
        <h3 className="text-lg font-semibold">Be among the first to share a Norwegian deck</h3>
        <p className="mt-1 text-default-500">
          Create an account to build a vocabulary collection and help the community library grow.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {featuredDecks.map(deck => (
        <PublicDeckCard key={deck.id} deck={deck} showFollowerCount={false} />
      ))}
    </div>
  );
}
