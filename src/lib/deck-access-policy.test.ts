import { describe, expect, it } from 'vitest';
import {
  isActiveFollow,
  resolveAccessibleReleaseId,
  resolveFollowReleaseId,
  type ReleaseAccessDeck,
  type ReleaseAccessFollow,
} from './deck-access-policy';

const deck: ReleaseAccessDeck = {
  ownerId: 'owner',
  status: 'active',
  visibility: 'private',
  currentReleaseId: 30,
};

const automaticFollow: ReleaseAccessFollow = {
  status: 'active',
  updateMode: 'automatic',
  pinnedReleaseId: null,
  lastSeenReleaseId: 20,
};

describe('release access policy', () => {
  it.each([
    { name: 'automatic follow', follow: automaticFollow, expected: 30 },
    {
      name: 'manual pinned follow',
      follow: { ...automaticFollow, updateMode: 'manual' as const, pinnedReleaseId: 10 },
      expected: 10,
    },
    {
      name: 'manual follow without a pin',
      follow: { ...automaticFollow, updateMode: 'manual' as const },
      expected: 20,
    },
    {
      name: 'frozen automatic follow',
      follow: { ...automaticFollow, status: 'frozen' as const },
      expected: 20,
    },
  ])('resolves the studied release for a $name', ({ follow, expected }) => {
    expect(resolveFollowReleaseId(follow, deck.currentReleaseId)).toBe(expected);
  });

  it.each([
    {
      name: 'owner previewing their deck',
      input: { deck, userId: 'owner', allowPublic: true },
      expected: 30,
    },
    {
      name: 'owner attempting to study without following',
      input: { deck, userId: 'owner', allowPublic: false },
      expected: null,
    },
    {
      name: 'active automatic follower',
      input: { deck, follow: automaticFollow, userId: 'learner', allowPublic: false },
      expected: 30,
    },
    {
      name: 'frozen follower',
      input: {
        deck: { ...deck, status: 'archived' as const },
        follow: { ...automaticFollow, status: 'frozen' as const },
        userId: 'learner',
        allowPublic: false,
      },
      expected: 20,
    },
    {
      name: 'unfollowed learner',
      input: {
        deck,
        follow: { ...automaticFollow, status: 'unfollowed' as const },
        userId: 'learner',
        allowPublic: false,
      },
      expected: null,
    },
    {
      name: 'public preview',
      input: {
        deck: { ...deck, visibility: 'public' as const },
        userId: 'visitor',
        allowPublic: true,
      },
      expected: 30,
    },
    {
      name: 'moderation-removed deck',
      input: {
        deck: { ...deck, status: 'moderation_removed' as const, visibility: 'public' as const },
        follow: automaticFollow,
        userId: 'learner',
        allowPublic: true,
      },
      expected: null,
    },
  ])('resolves access for a $name', ({ input, expected }) => {
    expect(resolveAccessibleReleaseId(input)).toBe(expected);
  });

  it('recognizes only active and frozen follow relationships', () => {
    expect(isActiveFollow({ status: 'active' })).toBe(true);
    expect(isActiveFollow({ status: 'frozen' })).toBe(true);
    expect(isActiveFollow({ status: 'unfollowed' })).toBe(false);
    expect(isActiveFollow(null)).toBe(false);
  });
});
