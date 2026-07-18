import { getCachedPublicDeckSitemapEntries } from '@/db/queries/public-deck.queries';
import { absoluteUrl } from '@/lib/site';
import type { MetadataRoute } from 'next';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const publicDecks = await getCachedPublicDeckSitemapEntries();

  return [
    {
      url: absoluteUrl('/'),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: absoluteUrl('/public/decks'),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    ...publicDecks.map(deck => ({
      url: absoluteUrl(`/public/decks/${deck.id}`),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    {
      url: absoluteUrl('/privacy'),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: absoluteUrl('/terms'),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ];
}
