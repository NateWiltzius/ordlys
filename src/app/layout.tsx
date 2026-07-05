import type { Metadata } from 'next';
import '@/styles/globals.css';
import { fontSans } from '@/config/font';
import { PropsWithChildren } from 'react';
import Navbar from '@/app/_components/navbar';

export const metadata: Metadata = {
  title: 'Ordlys',
  description:
    'Ordlys is a SRS based flashcard app that is build around consistent quizing rather than self review.',
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
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="flex justify-center gap-4 border-t border-default-200 px-4 py-6 text-sm text-default-500">
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </footer>
      </body>
    </html>
  );
}
