import Link from 'next/link';
import { signOutAction } from '@/server/auth.actions';
import { getCurrentUserIdOrNull } from '@/lib/auth/get-current-user-id';
import ThemeToggle from '@/app/_components/theme-toggle';
import MobileNavigation from '@/app/_components/mobile-navigation';
import { getNavigationItems, navigationItemClassName } from '@/app/_components/navigation-items';
import NavigationLink from '@/app/_components/navigation-link';
import { Tooltip } from '@heroui/react';

export default async function Navbar() {
  const loggedIn = Boolean(await getCurrentUserIdOrNull());
  const navigationItems = getNavigationItems(loggedIn);
  const homeHref = loggedIn ? '/dashboard' : '/';

  return (
    <nav
      data-app-navigation
      className="sticky top-0 z-50 flex w-full items-center justify-between gap-4 border-b border-default-200 bg-background/95 px-4 py-3 shadow-sm backdrop-blur sm:py-4"
    >
      <div className="flex shrink-0 items-center gap-2">
        <Link href={homeHref} className="text-2xl font-semibold">
          Ordlys
        </Link>
        <Tooltip delay={300} closeDelay={100}>
          <Tooltip.Trigger className="cursor-help rounded-full border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-primary outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
            Beta
          </Tooltip.Trigger>
          <Tooltip.Content
            placement="bottom start"
            showArrow
            className="w-80 max-w-[calc(100vw-2rem)] break-normal"
          >
            <div className="space-y-1">
              <p className="font-semibold">Ordlys is in beta</p>
              <p>
                Expect occasional rough edges and features to change. If something feels confusing
                or broken, please leave feedback using the link in the footer.
              </p>
            </div>
            <Tooltip.Arrow />
          </Tooltip.Content>
        </Tooltip>
      </div>
      <div className="hidden min-w-0 items-center gap-2 text-base md:flex">
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
