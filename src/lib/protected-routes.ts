export const PROTECTED_APP_PREFIXES = [
  '/account',
  '/dashboard',
  '/decks',
  '/discover',
  '/feedback',
  '/practice',
  '/review',
] as const;

export function isProtectedAppPath(pathname: string) {
  return PROTECTED_APP_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
