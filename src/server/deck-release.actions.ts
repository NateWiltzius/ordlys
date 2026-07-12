'use server';

import {
  changeDeckStatus,
  changeDeckCopyPolicy,
  changeDeckVisibility,
  forkRelease,
  moderateRemoveDeck,
  publishDeck,
  permanentlyDeleteFollowProgress,
  reportDeck,
  restrictedHardDeleteDeck,
  setFollowRelease,
  setDeckUnderReview,
  updateFollowToLatest,
} from '@/db/queries/deck-release.queries';
import {
  currentUserCanModerate,
  getCurrentUserId,
  isCurrentAccountVerified,
} from '@/lib/auth/get-current-user-id';
import { CONTENT_LIMITS, requiredText } from '@/lib/validation/content';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { actionFailure, withExpectedError } from '@/lib/action-result';
import { revalidatePath } from 'next/cache';

function deckId(value: number) {
  const id = parsePositiveInteger(value);
  if (!id) throw new Error('Invalid deck ID.');
  return id;
}

function refresh(id: number) {
  revalidatePath('/decks');
  revalidatePath('/dashboard');
  revalidatePath(`/decks/${id}`);
  revalidatePath(`/decks/${id}/edit`);
}

export async function publishDeckAction(id: number, summary: string, idempotencyKey: string) {
  return withExpectedError(async () => {
    const parsed = deckId(id);
    const key = requiredText(idempotencyKey, 'Request key', 128);
    const releaseId = await publishDeck(
      parsed,
      await getCurrentUserId(),
      requiredText(summary, 'Change summary', CONTENT_LIMITS.vocabNotes),
      key,
    );
    refresh(parsed);
    return releaseId;
  });
}

export async function pinDeckReleaseAction(id: number, releaseId: number) {
  return withExpectedError(async () => {
    const parsed = deckId(id);
    const release = parsePositiveInteger(releaseId);
    if (!release) throw new Error('Invalid release ID.');
    await setFollowRelease(parsed, await getCurrentUserId(), release, 'manual');
    refresh(parsed);
  });
}

export async function setAutomaticUpdatesAction(id: number) {
  return withExpectedError(async () => {
    const parsed = deckId(id);
    await updateFollowToLatest(parsed, await getCurrentUserId());
    refresh(parsed);
  });
}

export async function permanentlyDeleteFollowProgressAction(id: number) {
  return withExpectedError(async () => {
    const parsed = deckId(id);
    await permanentlyDeleteFollowProgress(parsed, await getCurrentUserId());
    refresh(parsed);
  });
}

export async function archiveDeckAction(id: number) {
  return withExpectedError(async () => {
    const parsed = deckId(id);
    await changeDeckStatus(parsed, await getCurrentUserId(), 'archived');
    refresh(parsed);
  });
}

export async function restoreDeckAction(id: number) {
  return withExpectedError(async () => {
    const parsed = deckId(id);
    await changeDeckStatus(parsed, await getCurrentUserId(), 'active');
    refresh(parsed);
  });
}

export async function softDeleteDeckAction(id: number) {
  return withExpectedError(async () => {
    const parsed = deckId(id);
    await changeDeckStatus(parsed, await getCurrentUserId(), 'deleted');
    refresh(parsed);
  });
}

export async function forkReleaseAction(releaseId: number, idempotencyKey: string) {
  return withExpectedError(async () => {
    const release = parsePositiveInteger(releaseId);
    if (!release) throw new Error('Invalid release ID.');
    const key = requiredText(idempotencyKey, 'Request key', 128);
    const forkDeckId = await forkRelease(release, await getCurrentUserId(), key);
    revalidatePath('/decks');
    revalidatePath('/dashboard');
    return forkDeckId;
  });
}

export async function changeDeckVisibilityAction(
  id: number,
  visibility: 'private' | 'unlisted' | 'public',
) {
  if (!['private', 'unlisted', 'public'].includes(visibility)) {
    return actionFailure('INVALID_VISIBILITY', 'Invalid visibility.');
  }
  if (visibility !== 'private' && !(await isCurrentAccountVerified())) {
    return actionFailure(
      'ACCOUNT_UNVERIFIED',
      'Verify your account before publishing a shared deck.',
    );
  }

  return withExpectedError(async () => {
    const parsed = deckId(id);
    await changeDeckVisibility(parsed, await getCurrentUserId(), visibility);
    refresh(parsed);
  });
}

export async function changeDeckCopyPolicyAction(
  id: number,
  copyPolicy: 'follow_only' | 'private_forks' | 'public_forks',
) {
  if (!['follow_only', 'private_forks', 'public_forks'].includes(copyPolicy)) {
    return actionFailure('INVALID_COPY_POLICY', 'Invalid copy policy.');
  }
  return withExpectedError(async () => {
    const parsed = deckId(id);
    await changeDeckCopyPolicy(parsed, await getCurrentUserId(), copyPolicy);
    refresh(parsed);
  });
}

export async function reportDeckAction(id: number, reason: string, details?: string) {
  return withExpectedError(async () => {
    const parsed = deckId(id);
    await reportDeck(
      parsed,
      await getCurrentUserId(),
      requiredText(reason, 'Reason', 64),
      details?.trim().slice(0, 2000),
    );
    refresh(parsed);
  });
}

export async function moderationRemoveDeckAction(id: number) {
  return withExpectedError(async () => {
    const parsed = deckId(id);
    await moderateRemoveDeck(parsed, await getCurrentUserId(), await currentUserCanModerate());
    refresh(parsed);
  });
}

export async function moderationReviewDeckAction(id: number) {
  return withExpectedError(async () => {
    const parsed = deckId(id);
    await setDeckUnderReview(parsed, await getCurrentUserId(), await currentUserCanModerate());
    refresh(parsed);
  });
}

export async function restrictedHardDeleteDeckAction(id: number) {
  return withExpectedError(async () => {
    const parsed = deckId(id);
    const removed = await restrictedHardDeleteDeck(parsed, await getCurrentUserId());
    refresh(parsed);
    return removed ? ('deleted' as const) : ('anonymized' as const);
  });
}
