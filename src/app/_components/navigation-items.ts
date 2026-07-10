export type NavigationItem = {
  href: string;
  label: string;
};

export const navigationItemClassName = {
  desktop: 'rounded-md px-2 py-2 text-primary sm:px-3',
  mobile: 'rounded-lg px-3 py-2 text-sm text-foreground hover:bg-default-100',
};

const authenticatedItems: NavigationItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/decks', label: 'Decks' },
  { href: '/account', label: 'Account' },
];

const publicItems: NavigationItem[] = [
  { href: '/public/decks', label: 'Discover' },
  { href: '/auth/sign-in', label: 'Sign In' },
  { href: '/auth/sign-up', label: 'Sign Up' },
];

export function getNavigationItems(loggedIn: boolean): NavigationItem[] {
  return loggedIn ? authenticatedItems : publicItems;
}
