export type DeckDiscoverySort = 'popular' | 'newest' | 'name';

type Discoverable = {
  title: string;
  description: string | null;
  subscriberCount: number;
  updatedAt: Date;
};

export function filterAndSortDecks<T extends Discoverable>(
  decks: T[],
  query: string,
  sort: DeckDiscoverySort,
): T[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filtered = normalizedQuery
    ? decks.filter(deck =>
        `${deck.title} ${deck.description ?? ''}`.toLocaleLowerCase().includes(normalizedQuery),
      )
    : decks;

  return [...filtered].sort((left, right) => {
    if (sort === 'popular') {
      return (
        right.subscriberCount - left.subscriberCount ||
        right.updatedAt.getTime() - left.updatedAt.getTime() ||
        left.title.localeCompare(right.title)
      );
    }
    if (sort === 'newest') {
      return (
        right.updatedAt.getTime() - left.updatedAt.getTime() ||
        left.title.localeCompare(right.title)
      );
    }
    return left.title.localeCompare(right.title) || right.subscriberCount - left.subscriberCount;
  });
}
