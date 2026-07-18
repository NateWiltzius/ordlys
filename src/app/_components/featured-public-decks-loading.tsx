import { PublicDeckCardSkeleton } from '@/components/shared/skeleton';

export default function FeaturedPublicDecksLoading() {
  return (
    <div
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      role="status"
      aria-label="Loading public decks"
      aria-busy="true"
    >
      <span className="sr-only">Loading public decks…</span>
      {Array.from({ length: 3 }, (_, index) => (
        <PublicDeckCardSkeleton key={index} />
      ))}
    </div>
  );
}
