import { describe, expect, it } from 'vitest';
import { getNavigationItems, isNavigationItemActive } from './navigation-items';

describe('navigation items', () => {
  it('orders the signed-in workflow before account utilities', () => {
    expect(getNavigationItems(true).map(item => item.label)).toEqual([
      'Today',
      'Library',
      'Discover',
      'Progress',
      'Account',
    ]);
  });

  it('keeps review and optional practice under Today', () => {
    expect(isNavigationItemActive('/review', '/dashboard')).toBe(true);
    expect(isNavigationItemActive('/practice/recent-mistakes', '/dashboard')).toBe(true);
    expect(isNavigationItemActive('/decks/55/review', '/dashboard')).toBe(false);
  });

  it('keeps nested deck routes under Library', () => {
    expect(isNavigationItemActive('/decks/55', '/decks')).toBe(true);
    expect(isNavigationItemActive('/decks/55/edit', '/decks')).toBe(true);
    expect(isNavigationItemActive('/discover', '/decks')).toBe(false);
  });
});
