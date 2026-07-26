import { describe, expect, it } from 'vitest';
import {
  getNavigationItems,
  isNavigationItemActive,
  navigationItemClassName,
} from './navigation-items';

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

  it('does not visually distinguish active desktop links', () => {
    const desktopClassName = navigationItemClassName('desktop', true);
    const desktopClasses = desktopClassName.split(' ');

    expect(desktopClasses).toContain('text-foreground');
    expect(desktopClasses).not.toContain('font-semibold');
    expect(desktopClasses).not.toContain('text-primary');
    expect(desktopClasses).not.toContain('underline');
    expect(desktopClasses).not.toContain('bg-default-100');
    expect(desktopClasses).not.toContain('shadow-sm');
    expect(navigationItemClassName('mobile', true)).toContain('bg-default-100');
  });
});
