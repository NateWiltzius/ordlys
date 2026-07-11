import Link from 'next/link';
import { signOutAction } from '@/server/auth.actions';
import { getCurrentUserIdOrNull } from '@/lib/auth/get-current-user-id';
import ThemeToggle from '@/app/_components/theme-toggle';
import MobileNavigation from '@/app/_components/mobile-navigation';
import { getNavigationItems, navigationItemClassName } from '@/app/_components/navigation-items';
import NavigationLink from '@/app/_components/navigation-link';

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
          <NavigationLink key={item.href} {...item} variant="desktop" />
        ))}
        {loggedIn && (
          <form action={signOutAction} className="inline-flex">
            <button
              type="submit"
              className={`${navigationItemClassName('desktop')} bg-transparent hover:cursor-pointer`}
            >
              Sign out
            </button>
          </form>
        )}
        <ThemeToggle />
      </div>
      <MobileNavigation loggedIn={loggedIn} />
    </nav>
  );
}
