'use client';

import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';
import ThemeToggle from '@/app/_components/theme-toggle';
import { getNavigationItems } from '@/app/_components/navigation-items';
import NavigationLink from '@/app/_components/navigation-link';
import SignOutControl from '@/app/_components/sign-out-control';

type Props = {
  loggedIn: boolean;
};

export default function MobileNavigation({ loggedIn }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigationItems = getNavigationItems(loggedIn);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative flex items-center gap-1 md:hidden">
      <ThemeToggle />
      <button
        type="button"
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-default-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={`${isOpen ? 'Close' : 'Open'} navigation menu`}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation-menu"
        onClick={() => setIsOpen(current => !current)}
      >
        {isOpen ? (
          <XMarkIcon className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Bars3Icon className="h-5 w-5" aria-hidden="true" />
        )}
      </button>
      {isOpen ? (
        <div
          id="mobile-navigation-menu"
          aria-label="Navigation menu"
          className="absolute top-full right-0 mt-2 w-44 rounded-xl border border-default-200 bg-background p-1 shadow-lg"
        >
          <div className="flex flex-col">
            {navigationItems.map(item => (
              <NavigationLink
                key={item.href}
                {...item}
                variant="mobile"
                onNavigate={() => setIsOpen(false)}
              />
            ))}
            {loggedIn && <SignOutControl variant="mobile" onSignedOut={() => setIsOpen(false)} />}
          </div>
        </div>
      ) : null}
    </div>
  );
}
