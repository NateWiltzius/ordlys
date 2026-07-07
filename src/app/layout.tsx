import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import { fontSans } from '@/config/font';
import { PropsWithChildren, Suspense } from 'react';
import Navbar from '@/app/_components/navbar';
import Link from 'next/link';

export const metadata: Metadata = {
  title: {
    default: 'Ordlys',
    template: '%s | Ordlys',
  },
  description:
    'Ordlys is an SRS-based flashcard app built around consistent quizzing rather than self-review.',
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
        <main className="flex-1">{children}</main>
        <footer
          data-app-footer
          className="flex justify-center gap-4 border-t border-default-200 px-4 py-6 text-sm text-default-500"
        >
          <Link href="/feedback">Feedback</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
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
