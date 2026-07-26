import type { NextConfig } from 'next';

const isProduction = process.env.NODE_ENV === 'production';

const securityHeaders = [
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  ...(isProduction
    ? [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '3mb',
    },
  },
  async headers() {
    const robotsHeader = {
      key: 'X-Robots-Tag',
      value: 'noindex, nofollow, noarchive',
    };

    return [
      { source: '/(.*)', headers: securityHeaders },
      { source: '/account/:path*', headers: [robotsHeader] },
      { source: '/auth/:path*', headers: [robotsHeader] },
      { source: '/dashboard/:path*', headers: [robotsHeader] },
      { source: '/decks/:path*', headers: [robotsHeader] },
    ];
  },
};

export default nextConfig;
