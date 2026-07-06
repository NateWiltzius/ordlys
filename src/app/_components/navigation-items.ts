export type NavigationItem = {
  href: string;
  label: string;
};

const authenticatedItems: NavigationItem[] = [
  { href: '/', label: 'Dashboard' },
  { href: '/decks', label: 'Decks' },
  { href: '/account', label: 'Account' },
];

const publicItems: NavigationItem[] = [
  { href: '/auth/sign-in', label: 'Sign In' },
  { href: '/auth/sign-up', label: 'Sign Up' },
];

export function getNavigationItems(loggedIn: boolean): NavigationItem[] {
  return loggedIn ? authenticatedItems : publicItems;
}
