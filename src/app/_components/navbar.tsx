import Link from 'next/link';
import { signOutAction } from '@/server/auth.actions';
import { getCurrentUserIdOrNull } from '@/lib/auth/get-current-user-id';
import ThemeToggle from '@/app/_components/theme-toggle';
import MobileNavigation from '@/app/_components/mobile-navigation';
import { getNavigationItems } from '@/app/_components/navigation-items';

export default async function Navbar() {
  const loggedIn = Boolean(await getCurrentUserIdOrNull());
  const navigationItems = getNavigationItems(loggedIn);
  const homeHref = loggedIn ? '/dashboard' : '/';

  return (
    <nav
      data-app-navigation
      className="sticky top-0 z-50 flex w-full items-center justify-between gap-4 border-b border-default-200 bg-background/95 px-4 py-3 shadow-sm backdrop-blur sm:py-4"
    >
      <div className="shrink-0">
        <Link href={homeHref} className="text-2xl font-semibold">
          Ordlys
        </Link>
      </div>
      <div className="hidden min-w-0 items-center gap-2 text-base sm:flex">
        {navigationItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md px-2 py-2 text-primary sm:px-3"
          >
            {item.label}
          </Link>
        ))}
        {loggedIn && (
          <form action={signOutAction} className="inline-flex">
            <button
              type="submit"
              className="link rounded-md bg-transparent px-2 py-2 text-primary sm:px-3"
            >
              Sign Out
            </button>
          </form>
        )}
        <ThemeToggle />
      </div>
      <MobileNavigation loggedIn={loggedIn} />
    </nav>
  );
}
