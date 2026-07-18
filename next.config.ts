import type { NextConfig } from 'next';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseOrigin = (() => {
  try {
    return supabaseUrl ? new URL(supabaseUrl).origin : '';
  } catch {
    return '';
  }
})();
const supabaseSocketOrigin = supabaseOrigin.replace(/^http/, 'ws');
const isProduction = process.env.NODE_ENV === 'production';
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline'${isProduction ? '' : " 'unsafe-eval'"}`,
  `connect-src 'self' ${supabaseOrigin} ${supabaseSocketOrigin} https://*.vercel-insights.com`,
  isProduction ? 'upgrade-insecure-requests' : '',
]
  .filter(Boolean)
  .join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
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
