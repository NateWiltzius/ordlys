import { describe, expect, it } from 'vitest';
import { getDeckCardActionPlan, getDeckRowPrimaryAction } from './deck-card-actions';

describe('getDeckCardActionPlan', () => {
  it('makes review primary for a followed deck', () => {
    expect(
      getDeckCardActionPlan({
        context: 'learning',
        relationship: 'following',
        isFollowing: true,
        hasPublishedRelease: true,
        allowsCopying: true,
      }),
    ).toEqual({
      primary: 'review',
      menu: ['copy', 'unfollow'],
    });
  });

  it('keeps management available for an owned deck that is also followed', () => {
    expect(
      getDeckCardActionPlan({
        context: 'learning',
        relationship: 'owned',
        isFollowing: true,
        hasPublishedRelease: true,
        allowsCopying: true,
      }),
    ).toEqual({
      primary: 'review',
      menu: ['manage', 'unfollow', 'delete'],
    });
  });

  it('makes management primary for an owned deck in the created section', () => {
    expect(
      getDeckCardActionPlan({
        context: 'created',
        relationship: 'owned',
        isFollowing: true,
        hasPublishedRelease: true,
        allowsCopying: true,
      }),
    ).toEqual({
      primary: 'manage',
      menu: ['review', 'unfollow', 'delete'],
    });
  });

  it('offers follow after an owned deck is published', () => {
    expect(
      getDeckCardActionPlan({
        context: 'created',
        relationship: 'owned',
        isFollowing: false,
        hasPublishedRelease: true,
        allowsCopying: true,
      }),
    ).toEqual({
      primary: 'manage',
      menu: ['follow', 'delete'],
    });
  });

  it('does not offer follow for an unpublished owned deck', () => {
    expect(
      getDeckCardActionPlan({
        context: 'created',
        relationship: 'copy',
        isFollowing: false,
        hasPublishedRelease: false,
        allowsCopying: true,
      }),
    ).toEqual({
      primary: 'manage',
      menu: ['delete'],
    });
  });

  it('makes follow primary in discovery and keeps copying secondary', () => {
    expect(
      getDeckCardActionPlan({
        context: 'discover',
        relationship: 'discover',
        isFollowing: false,
        hasPublishedRelease: true,
        allowsCopying: true,
      }),
    ).toEqual({
      primary: 'follow',
      menu: ['copy'],
    });
  });

  it('does not render an empty menu for a follow-only discovery deck', () => {
    expect(
      getDeckCardActionPlan({
        context: 'discover',
        relationship: 'discover',
        isFollowing: false,
        hasPublishedRelease: true,
        allowsCopying: false,
      }),
    ).toEqual({
      primary: 'follow',
      menu: [],
    });
  });

  it('makes restore the only action for an archived or deleted deck', () => {
    expect(
      getDeckCardActionPlan({
        context: 'created',
        relationship: 'restorable',
        isFollowing: false,
        hasPublishedRelease: true,
        allowsCopying: true,
      }),
    ).toEqual({
      primary: 'restore',
      menu: [],
    });
  });
});

describe('getDeckRowPrimaryAction', () => {
  it('opens followed decks from discovery instead of starting a review blindly', () => {
    expect(
      getDeckRowPrimaryAction('review', 'discover', {
        reviewsDue: 0,
        newWordsAvailable: 0,
      }),
    ).toBe('open');
  });

  it('prioritizes reviews, then learning, for learning rows', () => {
    expect(
      getDeckRowPrimaryAction('review', 'learning', {
        reviewsDue: 3,
        newWordsAvailable: 5,
      }),
    ).toBe('review');
    expect(
      getDeckRowPrimaryAction('review', 'learning', {
        reviewsDue: 0,
        newWordsAvailable: 5,
      }),
    ).toBe('learn');
    expect(
      getDeckRowPrimaryAction('review', 'learning', {
        reviewsDue: 0,
        newWordsAvailable: 0,
      }),
    ).toBe('open');
  });

  it('preserves the action policy outside active learning rows', () => {
    expect(
      getDeckRowPrimaryAction('manage', 'created', {
        reviewsDue: 4,
        newWordsAvailable: 4,
      }),
    ).toBe('manage');
  });
});
