'use client';

import Link from 'next/link';
import ThemeToggle from '@/app/_components/theme-toggle';
import MobileNavigation from '@/app/_components/mobile-navigation';
import { getNavigationItems } from '@/app/_components/navigation-items';
import NavigationLink from '@/app/_components/navigation-link';
import { useAuthSessionState } from '@/hooks/use-auth-session-state';
import SignOutControl from '@/app/_components/sign-out-control';

export default function Navbar() {
  const loggedIn = useAuthSessionState();
  const authResolved = loggedIn !== null;
  const navigationItems = authResolved ? getNavigationItems(loggedIn) : [];
  const homeHref = loggedIn ? '/dashboard' : '/';

  return (
    <nav
      data-app-navigation
      aria-label="Main navigation"
      aria-busy={!authResolved}
      className="sticky top-0 z-50 flex w-full items-center justify-between gap-4 border-b border-default-200 bg-background/95 px-4 py-3 shadow-sm backdrop-blur sm:py-4"
    >
      <div className="flex shrink-0 items-center gap-2">
        {authResolved ? (
          <Link href={homeHref} className="text-2xl font-semibold">
            Ordlys
          </Link>
        ) : (
          <span className="text-2xl font-semibold">Ordlys</span>
        )}
        <div className="group relative">
          <button
            type="button"
            className="h-auto min-w-0 cursor-help rounded-full border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-primary"
            aria-describedby="beta-description"
          >
            Beta
          </button>
          <div
            id="beta-description"
            role="tooltip"
            className="invisible absolute top-full left-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-default-200 bg-background p-3 text-sm font-normal normal-case tracking-normal text-foreground opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
          >
            <div className="space-y-1">
              <p className="font-semibold">Ordlys is in beta</p>
              <p>
                Expect occasional rough edges and features to change. If something feels confusing
                or broken, please leave feedback using the link in the footer.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="hidden min-w-0 items-center gap-2 text-base md:flex">
        {authResolved ? (
          <>
            {navigationItems.map(item => (
              <NavigationLink key={item.href} {...item} variant="desktop" />
            ))}
            {loggedIn ? <SignOutControl variant="desktop" /> : null}
          </>
        ) : (
          <div className="h-9 w-44 animate-pulse rounded-lg bg-default-200" aria-hidden="true" />
        )}
        <ThemeToggle />
      </div>
      {authResolved ? (
        <MobileNavigation loggedIn={loggedIn} />
      ) : (
        <div className="flex items-center gap-1 md:hidden" aria-hidden="true">
          <ThemeToggle />
          <div className="size-11 animate-pulse rounded-lg bg-default-200" />
        </div>
      )}
    </nav>
  );
}
