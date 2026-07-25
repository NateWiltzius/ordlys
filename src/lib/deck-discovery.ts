export type DeckDiscoverySort = 'recommended' | 'popular' | 'newest' | 'name';

type Discoverable = {
  title: string;
  description: string | null;
  subscriberCount: number;
  updatedAt: Date | string;
};

function updatedAtTimestamp(value: Date | string): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

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
    if (sort === 'recommended' || sort === 'popular') {
      return (
        right.subscriberCount - left.subscriberCount ||
        updatedAtTimestamp(right.updatedAt) - updatedAtTimestamp(left.updatedAt) ||
        left.title.localeCompare(right.title)
      );
    }
    if (sort === 'newest') {
      return (
        updatedAtTimestamp(right.updatedAt) - updatedAtTimestamp(left.updatedAt) ||
        left.title.localeCompare(right.title)
      );
    }
    return left.title.localeCompare(right.title) || right.subscriberCount - left.subscriberCount;
  });
}
