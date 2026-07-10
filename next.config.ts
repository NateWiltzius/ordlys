import type { NextConfig } from 'next';

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
      { source: '/account/:path*', headers: [robotsHeader] },
      { source: '/auth/:path*', headers: [robotsHeader] },
      { source: '/dashboard/:path*', headers: [robotsHeader] },
      { source: '/decks/:path*', headers: [robotsHeader] },
      { source: '/feedback/:path*', headers: [robotsHeader] },
    ];
  },
};

export default nextConfig;
