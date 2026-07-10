const configuredSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined);

export const SITE_URL = new URL(configuredSiteUrl ?? 'http://localhost:3000');

export const OPEN_GRAPH_IMAGE = {
  url: '/opengraph-image',
  width: 1200,
  height: 630,
  alt: 'Ordlys spaced repetition flashcards for language learning',
};

export const TWITTER_IMAGE = {
  url: '/twitter-image',
  width: 1200,
  height: 630,
  alt: OPEN_GRAPH_IMAGE.alt,
};

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).href;
}
