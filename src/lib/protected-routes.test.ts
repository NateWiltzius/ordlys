import { describe, expect, it } from 'vitest';
import { isProtectedAppPath } from './protected-routes';

describe('protected application routes', () => {
  it.each([
    '/account',
    '/dashboard',
    '/decks/12/edit',
    '/discover',
    '/practice/recent-mistakes',
    '/review',
  ])('protects %s', pathname => {
    expect(isProtectedAppPath(pathname)).toBe(true);
  });

  it.each(['/', '/auth/sign-in', '/feedback', '/public/decks', '/decks-public'])(
    'does not protect %s',
    pathname => {
      expect(isProtectedAppPath(pathname)).toBe(false);
    },
  );
});
