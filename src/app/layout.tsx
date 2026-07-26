import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import { fontSans } from '@/config/font';
import { PropsWithChildren } from 'react';
import Navbar from '@/app/_components/navbar';
import Link from 'next/link';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { OPEN_GRAPH_IMAGE, SITE_URL, TWITTER_IMAGE } from '@/lib/site';
import AuthSessionProvider from '@/components/providers/auth-session-provider';
import AppChromeState from '@/app/_components/app-chrome-state';
import { isProduction } from '@/config/server-env';
import { headers } from 'next/headers';
import { getCurrentUserIdOrNull } from '@/lib/auth/get-current-user-id';

const siteTitle = 'Ordlys – Spaced Repetition Flashcards for Any Subject';
const siteDescription =
  'Create or follow flashcard decks for any subject, practise active recall, and review each card at the right time.';
const enableVercelTelemetry = isProduction();

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  applicationName: 'Ordlys',
  title: {
    default: siteTitle,
    template: '%s | Ordlys',
  },
  description: siteDescription,
  openGraph: {
    type: 'website',
    siteName: 'Ordlys',
    title: siteTitle,
    description: siteDescription,
    images: [OPEN_GRAPH_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: [TWITTER_IMAGE],
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icons/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/icon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Ordlys',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  interactiveWidget: 'resizes-content',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' },
  ],
};

export default async function RootLayout({ children }: PropsWithChildren) {
  const [requestHeaders, userId] = await Promise.all([headers(), getCurrentUserIdOrNull()]);
  const nonce = requestHeaders.get('x-nonce') ?? undefined;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `(function(){var p=location.pathname;var active=p==='/review'||p==='/practice/recent-mistakes'||/^\\/decks\\/[^/]+\\/(?:learn|review)$/.test(p)||/^\\/decks\\/[^/]+\\/placement\\/[^/]+$/.test(p);if(active)document.documentElement.dataset.quizActive='true'})();`,
          }}
        />
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var saved=localStorage.getItem('theme');var dark=saved==='dark'||(!saved&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',dark);document.documentElement.style.colorScheme=dark?'dark':'light'}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`flex min-h-screen flex-col bg-background font-sans text-foreground antialiased ${fontSans.variable}`}
      >
        <AuthSessionProvider initialLoggedIn={userId !== null}>
          <AppChromeState />
          <a
            href="#main-content"
            className="skip-link sr-only fixed top-3 left-3 z-[100] rounded-lg bg-background px-4 py-2 font-medium text-foreground shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Skip to main content
          </a>
          <Navbar />
          {enableVercelTelemetry ? (
            <>
              <Analytics />
              <SpeedInsights />
            </>
          ) : null}
          <main id="main-content" className="flex-1" tabIndex={-1}>
            {children}
          </main>
          <footer
            data-app-footer
            className="flex justify-center gap-4 border-t border-default-200 px-4 py-6 text-sm text-default-500"
          >
            <Link href="/how-to-use" className="rounded-sm hover:text-primary hover:underline">
              How to use
            </Link>
            <Link href="/feedback" className="rounded-sm hover:text-primary hover:underline">
              Feedback
            </Link>
            <Link href="/privacy" className="rounded-sm hover:text-primary hover:underline">
              Privacy
            </Link>
            <Link href="/terms" className="rounded-sm hover:text-primary hover:underline">
              Terms
            </Link>
          </footer>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
