type NavigationItem = {
  href: string;
  label: string;
  section: 'main' | 'utility';
};

const navigationItemBase = {
  desktop:
    'rounded-md px-2 py-2 transition-colors hover:bg-default-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:px-3',
  mobile:
    'flex min-h-11 items-center rounded-lg px-3 py-2 text-sm transition-colors hover:bg-default-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
};

export function navigationItemClassName(variant: 'desktop' | 'mobile', isActive = false) {
  const activeClassName =
    variant === 'desktop' ? 'text-foreground' : 'bg-default-100 font-semibold text-foreground';

  return `${navigationItemBase[variant]} ${isActive ? activeClassName : 'text-foreground'}`;
}

const authenticatedItems: NavigationItem[] = [
  { href: '/dashboard', label: 'Today', section: 'main' },
  { href: '/decks', label: 'Library', section: 'main' },
  { href: '/discover', label: 'Discover', section: 'main' },
  { href: '/progress', label: 'Progress', section: 'main' },
  { href: '/account', label: 'Account', section: 'utility' },
];

const publicItems: NavigationItem[] = [
  { href: '/public/decks', label: 'Discover', section: 'main' },
  { href: '/auth/sign-in', label: 'Sign in', section: 'main' },
  { href: '/auth/sign-up', label: 'Sign up', section: 'main' },
];

export function getNavigationItems(loggedIn: boolean): NavigationItem[] {
  return loggedIn ? authenticatedItems : publicItems;
}

export function isNavigationItemActive(pathname: string, href: string) {
  if (href === '/dashboard') {
    return pathname === '/dashboard' || pathname === '/review' || pathname.startsWith('/practice/');
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
