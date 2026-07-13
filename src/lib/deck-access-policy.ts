export type ReleaseAccessDeck = {
  ownerId: string;
  status: 'active' | 'archived' | 'deleted' | 'moderation_removed';
  visibility: 'private' | 'unlisted' | 'public';
  currentReleaseId: number | null;
};

export type ReleaseAccessFollow = {
  status: 'active' | 'unfollowed' | 'frozen';
  updateMode: 'automatic' | 'manual';
  pinnedReleaseId: number | null;
  lastSeenReleaseId: number | null;
};

export function isActiveFollow(
  follow: Pick<ReleaseAccessFollow, 'status'> | null | undefined,
): boolean {
  return follow?.status === 'active' || follow?.status === 'frozen';
}

export function resolveFollowReleaseId(
  follow: ReleaseAccessFollow,
  currentReleaseId: number | null,
): number | null {
  if (follow.updateMode === 'manual') {
    return follow.pinnedReleaseId ?? follow.lastSeenReleaseId;
  }

  if (follow.status === 'frozen') return follow.lastSeenReleaseId;

  return currentReleaseId;
}

type ResolveAccessibleReleaseInput = {
  deck: ReleaseAccessDeck;
  follow?: ReleaseAccessFollow | null;
  userId: string;
  allowPublic: boolean;
};

/**
 * Resolves the release visible to one user outside a SQL query.
 * Keep the equivalent CASE expression in db/queries/deck-access.ts in parity with this policy.
 */
export function resolveAccessibleReleaseId({
  deck,
  follow,
  userId,
  allowPublic,
}: ResolveAccessibleReleaseInput): number | null {
  if (deck.status === 'moderation_removed') return null;

  if (allowPublic && deck.ownerId === userId) return deck.currentReleaseId;

  if (follow && isActiveFollow(follow)) {
    return resolveFollowReleaseId(follow, deck.currentReleaseId);
  }

  if (allowPublic && deck.status === 'active' && deck.visibility !== 'private') {
    return deck.currentReleaseId;
  }

  return null;
}
