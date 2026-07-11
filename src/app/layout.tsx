import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import { fontSans } from '@/config/font';
import { PropsWithChildren, Suspense } from 'react';
import Navbar from '@/app/_components/navbar';
import Link from 'next/link';
import { Analytics } from '@vercel/analytics/next';
import { OPEN_GRAPH_IMAGE, SITE_URL, TWITTER_IMAGE } from '@/lib/site';

const siteTitle = 'Ordlys – Spaced Repetition Flashcards for Language Learning';
const siteDescription =
  'Build vocabulary decks, learn with active recall, and review words at the right time with Ordlys spaced repetition flashcards.';

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
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    shortcut: '/icon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var saved=localStorage.getItem('theme');var dark=saved==='dark'||(!saved&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',dark);document.documentElement.style.colorScheme=dark?'dark':'light'}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`flex min-h-screen flex-col bg-background font-sans text-foreground antialiased ${fontSans.variable}`}
      >
        <Suspense fallback={<NavbarLoading />}>
          <Navbar />
        </Suspense>
        <Analytics />
        <main className="flex-1">{children}</main>
        <footer
          data-app-footer
          className="flex justify-center gap-4 border-t border-default-200 px-4 py-6 text-sm text-default-500"
        >
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
      </body>
    </html>
  );
}

function NavbarLoading() {
  return (
    <nav
      data-app-navigation
      className="sticky top-0 z-50 flex w-full items-center justify-between gap-4 border-b border-default-200 bg-background/95 px-4 py-3 shadow-sm backdrop-blur sm:py-4"
      aria-label="Loading navigation"
      aria-busy="true"
    >
      <div className="h-8 w-20 animate-pulse rounded-md bg-default-200" />
      <div className="hidden items-center gap-2 sm:flex">
        <div className="h-9 w-20 animate-pulse rounded-md bg-default-200" />
        <div className="h-9 w-20 animate-pulse rounded-md bg-default-200" />
        <div className="h-9 w-20 animate-pulse rounded-md bg-default-200" />
      </div>
      <div className="h-10 w-10 animate-pulse rounded-md bg-default-200 sm:hidden" />
    </nav>
  );
}
