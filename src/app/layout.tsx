import type { Metadata } from 'next';
import '@/styles/globals.css';
import { fontSans } from '@/config/font';
import { PropsWithChildren } from 'react';
import Navbar from '@/components/shared/layout/navbar/navbar';

export const metadata: Metadata = {
  title: 'Ordlys',
  description:
    'Ordlys is a SRS based flashcard app that is build around consistent quizing rather than self review.',
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`min-h-screen bg-background font-sans text-foreground antialiased ${fontSans.variable}`}
      >
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
