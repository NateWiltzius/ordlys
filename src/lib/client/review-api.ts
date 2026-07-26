import 'client-only';

import type { NextReviewBatch } from '@/types/review.types';

export async function getNextReviewBatch(
  deckId?: number,
  signal?: AbortSignal,
): Promise<NextReviewBatch | null> {
  const query = deckId === undefined ? '' : `?${new URLSearchParams({ deckId: String(deckId) })}`;
  const response = await fetch(`/api/reviews/next${query}`, {
    cache: 'no-store',
    signal,
  });
  if (!response.ok) throw new Error(`Request failed with status ${response.status}.`);
  return (await response.json()) as NextReviewBatch | null;
}
