type NavigationItem = {
  href: string;
  label: string;
};

const navigationItemBase = {
  desktop:
    'rounded-md px-2 py-2 transition-colors hover:bg-default-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:px-3',
  mobile:
    'flex min-h-11 items-center rounded-lg px-3 py-2 text-sm transition-colors hover:bg-default-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
};

export function navigationItemClassName(variant: 'desktop' | 'mobile', isActive = false) {
  return `${navigationItemBase[variant]} ${
    isActive ? 'bg-primary/10 font-medium text-primary' : 'text-foreground'
  }`;
}

const authenticatedItems: NavigationItem[] = [
  { href: '/dashboard', label: 'Today' },
  { href: '/progress', label: 'Progress' },
  { href: '/decks', label: 'Library' },
  { href: '/discover', label: 'Discover' },
  { href: '/account', label: 'Account' },
];

const publicItems: NavigationItem[] = [
  { href: '/public/decks', label: 'Discover' },
  { href: '/auth/sign-in', label: 'Sign in' },
  { href: '/auth/sign-up', label: 'Sign up' },
];

export function getNavigationItems(loggedIn: boolean): NavigationItem[] {
  return loggedIn ? authenticatedItems : publicItems;
}
