import { absoluteUrl, SITE_URL } from '@/lib/site';
import { PROTECTED_APP_PREFIXES } from '@/lib/protected-routes';
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [...PROTECTED_APP_PREFIXES, '/auth/update-password'],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
    host: SITE_URL.origin,
  };
}
