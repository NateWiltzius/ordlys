import { describe, expect, it } from 'vitest';
import { getDeckCardActionPlan } from './deck-card-actions';

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
