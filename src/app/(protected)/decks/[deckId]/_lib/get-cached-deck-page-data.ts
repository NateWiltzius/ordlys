import 'server-only';

import { getAccessibleDeckById } from '@/db/queries/deck.queries';
import {
  getDeckFollowState,
  getProtectedDeckFollowerCount,
  inspectReleaseChanges,
  listReleaseHistory,
} from '@/db/queries/deck-release.queries';
import { currentUserCanModerate, getCurrentUserId } from '@/lib/auth/get-current-user-id';
import { cache } from 'react';

export const getCachedDeckPageIdentity = cache(async (deckId: number) => {
  const userId = await getCurrentUserId();
  const [deck, followState] = await Promise.all([
    getAccessibleDeckById(deckId, userId),
    getDeckFollowState(deckId, userId),
  ]);
  if (!deck) return null;

  return {
    deck,
    isOwned: deck.ownerId === userId,
    isFollowing: followState?.status === 'active' || followState?.status === 'frozen',
    followState,
  };
});

export const getCachedDeckHeaderControlsData = cache(async (deckId: number) => {
  const identity = await getCachedDeckPageIdentity(deckId);
  if (!identity) return null;

  const [releases, canModerate] = await Promise.all([
    listReleaseHistory(deckId),
    currentUserCanModerate(),
  ]);
  const { deck, followState, isOwned } = identity;
  const [releaseChanges, protectedFollowerCount] = await Promise.all([
    followState?.currentRelease &&
    followState.studiedRelease &&
    followState.currentRelease.id !== followState.studiedRelease.id
      ? inspectReleaseChanges(followState.currentRelease.id, followState.studiedRelease.id)
      : null,
    isOwned && deck.status === 'deleted' ? getProtectedDeckFollowerCount(deckId) : null,
  ]);

  return {
    ...identity,
    releases,
    releaseChanges,
    canModerate,
    protectedFollowerCount,
  };
});
