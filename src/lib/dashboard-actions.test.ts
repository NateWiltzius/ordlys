import { describe, expect, it } from 'vitest';
import { getDashboardActionOrder, getDashboardReviewAction } from './dashboard-actions';

describe('getDashboardActionOrder', () => {
  it('keeps the familiar order when every action is available', () => {
    expect(
      getDashboardActionOrder({
        reviewsDue: 3,
        newWordsAvailable: 5,
        recentMistakes: 2,
      }),
    ).toEqual(['review', 'learn', 'practice']);
  });

  it('moves available actions ahead of unavailable actions', () => {
    expect(
      getDashboardActionOrder({
        reviewsDue: 0,
        newWordsAvailable: 5,
        recentMistakes: 2,
      }),
    ).toEqual(['learn', 'practice', 'review']);
  });

  it('puts the only available action first', () => {
    expect(
      getDashboardActionOrder({
        reviewsDue: 0,
        newWordsAvailable: 0,
        recentMistakes: 2,
      }),
    ).toEqual(['practice', 'review', 'learn']);
  });

  it('keeps the familiar order when no action is available', () => {
    expect(
      getDashboardActionOrder({
        reviewsDue: 0,
        newWordsAvailable: 0,
        recentMistakes: 0,
      }),
    ).toEqual(['review', 'learn', 'practice']);
  });
});

describe('getDashboardReviewAction', () => {
  it('disables the action when no reviews are due', () => {
    expect(getDashboardReviewAction(0, [])).toEqual({
      href: undefined,
      shouldChooseDeck: false,
    });
  });

  it('links directly to the only deck with reviews', () => {
    expect(getDashboardReviewAction(3, [42])).toEqual({
      href: '/decks/42/review',
      shouldChooseDeck: false,
    });
  });

  it('opens the chooser when several decks have reviews', () => {
    expect(getDashboardReviewAction(3, [42, 55])).toEqual({
      href: undefined,
      shouldChooseDeck: true,
    });
  });

  it('falls back to the all-decks review route if aggregate data is still loading', () => {
    expect(getDashboardReviewAction(3, [])).toEqual({
      href: '/review',
      shouldChooseDeck: false,
    });
  });
});
