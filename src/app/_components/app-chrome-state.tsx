'use client';

import { usePathname } from 'next/navigation';
import { useLayoutEffect } from 'react';

export default function AppChromeState() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const root = document.documentElement;

    if (isImmersiveStudyPath(pathname)) {
      root.dataset.quizActive = 'true';
    } else {
      delete root.dataset.quizActive;
    }
  }, [pathname]);

  return null;
}

function isImmersiveStudyPath(pathname: string): boolean {
  return (
    pathname === '/review' ||
    pathname === '/practice/recent-mistakes' ||
    /^\/decks\/[^/]+\/(?:learn|review)$/.test(pathname) ||
    /^\/decks\/[^/]+\/placement\/[^/]+$/.test(pathname)
  );
}
