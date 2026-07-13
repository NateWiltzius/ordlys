'use server';

import {
  createDeck,
  getAccessibleDeckById,
  getDeckCardStudyCounts,
  getDecksByOwnerId,
  getDeckStudyCounts,
  getOwnedDeckById,
  getPublicDecks,
  getRestorableDecksByOwnerId,
  getUserActiveDecks,
  getUserFollowedDecks,
  updateDeck,
} from '@/db/queries/deck.queries';
import { changeDeckStatus } from '@/db/queries/deck-release.queries';
import { CreateDeck, CreateDeckInput } from '@/types/deck.types';
import { revalidatePath } from 'next/cache';
import { currentUserCanModerate, getCurrentUserId } from '@/lib/auth/get-current-user-id';
import {
  CONTENT_LIMITS,
  optionalLanguageTag,
  optionalText,
  requiredText,
} from '@/lib/validation/content';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { getEditLessonSummaries } from '@/db/queries/lesson.queries';
import { getActiveReleaseId } from '@/db/queries/deck-access';
import {
  getNewVocabCountsForDecks,
  getNextReviewBatch,
  getReviewForecastCounts,
} from '@/db/queries/review.queries';
import { buildReviewForecast } from '@/lib/review-forecast';
import {
  getDeckFollowState,
  getProtectedDeckFollowerCount,
  getDeckProvenance,
  getRemovedDraftItems,
  hasUnpublishedDraftChanges,
  inspectReleaseChanges,
  listReleaseHistory,
} from '@/db/queries/deck-release.queries';
import { withExpectedError } from '@/lib/action-result';

export async function getDashboardDataAction() {
  const userId = await getCurrentUserId();
  const activeDecks = await getUserActiveDecks(userId);
  const activeDeckIds = activeDecks.map(deck => deck.id);
  const [deckStudyCounts, newVocabCounts, forecastCounts, nextReview] = await Promise.all([
    getDeckCardStudyCounts(activeDeckIds, userId),
    getNewVocabCountsForDecks(activeDeckIds, userId),
    getReviewForecastCounts(userId, activeDeckIds),
    getNextReviewBatch(userId, activeDeckIds),
  ]);

  const deckStats = Object.fromEntries(
    activeDeckIds.map(deckId => [
      deckId,
      {
        totalWords: deckStudyCounts[deckId]?.totalWords ?? 0,
        reviewsDue: deckStudyCounts[deckId]?.reviewsDue ?? 0,
        wordsInReview: deckStudyCounts[deckId]?.wordsInReview ?? 0,
      },
    ]),
  );
  const allDeckStats = activeDeckIds.reduce(
    (totals, deckId) => ({
      totalWords: totals.totalWords + (deckStudyCounts[deckId]?.totalWords ?? 0),
      newWordsAvailable: totals.newWordsAvailable + (newVocabCounts[deckId] ?? 0),
      reviewsDue: totals.reviewsDue + (deckStudyCounts[deckId]?.reviewsDue ?? 0),
      wordsInReview: totals.wordsInReview + (deckStudyCounts[deckId]?.wordsInReview ?? 0),
    }),
    { totalWords: 0, newWordsAvailable: 0, reviewsDue: 0, wordsInReview: 0 },
  );

  return {
    activeDecks,
    allDeckStats,
    deckStats,
    reviewForecast: buildReviewForecast(forecastCounts),
    nextReview,
  };
}

export async function getDecksPageDataAction() {
  const userId = await getCurrentUserId();
  const [ownedDecks, publicDecks, learningDecks, restorableDecks] = await Promise.all([
    getDecksByOwnerId(userId),
    getPublicDecks(userId),
    getUserFollowedDecks(userId),
    getRestorableDecksByOwnerId(userId),
  ]);
  return { ownedDecks, publicDecks, learningDecks, restorableDecks };
}

export async function getDeckPageDataAction(id: number) {
  const deckId = parsePositiveInteger(id);
  if (!deckId) throw new Error('Invalid deck ID.');
  const userId = await getCurrentUserId();
  const [deck, forecastCounts, nextReview, followState, releases, canModerate, activeReleaseId] =
    await Promise.all([
      getAccessibleDeckById(deckId, userId),
      getReviewForecastCounts(userId, [deckId]),
      getNextReviewBatch(userId, [deckId]),
      getDeckFollowState(deckId, userId),
      listReleaseHistory(deckId),
      currentUserCanModerate(),
      getActiveReleaseId(deckId, userId),
    ]);
  if (!deck) return null;
  const isOwned = deck.ownerId === userId;
  const protectedFollowerCount =
    isOwned && deck.status === 'deleted' ? await getProtectedDeckFollowerCount(deckId) : null;
  const isFollowing = followState?.status === 'active' || followState?.status === 'frozen';
  const releaseChanges =
    followState?.currentRelease &&
    followState.studiedRelease &&
    followState.currentRelease.id !== followState.studiedRelease.id
      ? await inspectReleaseChanges(followState.currentRelease.id, followState.studiedRelease.id)
      : null;
  return {
    deck,
    isOwned,
    isFollowing,
    canStudy: Boolean(activeReleaseId),
    reviewForecast: buildReviewForecast(forecastCounts),
    nextReview,
    followState,
    releases,
    releaseChanges,
    canModerate,
    protectedFollowerCount,
  };
}

export async function getEditDeckPageDataAction(id: number) {
  const deckId = parsePositiveInteger(id);
  if (!deckId) throw new Error('Invalid deck ID.');
  const userId = await getCurrentUserId();
  const deck = await getOwnedDeckById(deckId, userId);
  if (!deck) return null;
  const [lessons, releases, hasUnpublishedChanges, provenance, removedDraftItems] =
    await Promise.all([
      getEditLessonSummaries(deckId),
      listReleaseHistory(deckId),
      hasUnpublishedDraftChanges(deckId),
      getDeckProvenance(deckId),
      getRemovedDraftItems(deckId),
    ]);
  return {
    deck,
    lessons,
    releases,
    hasUnpublishedChanges,
    provenance,
    removedDraftItems,
  };
}

export async function getDeckStudyCountsAction(id: number) {
  const deckId = parsePositiveInteger(id);
  if (!deckId) throw new Error('Invalid deck ID.');
  return getDeckStudyCounts(deckId, await getCurrentUserId());
}

export async function createDeckAction(deck: CreateDeckInput) {
  return withExpectedError(async () => {
    const userId = await getCurrentUserId();
    if (!deck || typeof deck !== 'object') throw new Error('Invalid deck.');
    const deckWithOwner: CreateDeck = {
      title: requiredText(deck.title, 'Deck title', CONTENT_LIMITS.deckTitle),
      description: optionalText(deck.description, 'Description', CONTENT_LIMITS.deckDescription),
      frontLanguage: optionalLanguageTag(deck.frontLanguage, 'Front language'),
      backLanguage: optionalLanguageTag(deck.backLanguage, 'Back language'),
      // New authoring workspaces are always private. Publishing/sharing is a separate transition.
      visibility: 'private',
      ownerId: userId,
    };

    await createDeck(deckWithOwner);
    revalidatePath('/decks');
  });
}

export async function updateDeckAction(id: number, input: Omit<CreateDeckInput, 'visibility'>) {
  return withExpectedError(async () => {
    const deckId = parsePositiveInteger(id);
    if (!deckId || !input || typeof input !== 'object') throw new Error('Invalid deck.');
    const userId = await getCurrentUserId();
    await updateDeck(deckId, userId, {
      title: requiredText(input.title, 'Deck title', CONTENT_LIMITS.deckTitle),
      description: optionalText(input.description, 'Description', CONTENT_LIMITS.deckDescription),
      frontLanguage: optionalLanguageTag(input.frontLanguage, 'Front language'),
      backLanguage: optionalLanguageTag(input.backLanguage, 'Back language'),
    });
    revalidatePath('/decks');
    revalidatePath(`/decks/${deckId}`);
    revalidatePath(`/decks/${deckId}/edit`);
  });
}

export async function deleteDeckAction(id: number) {
  return withExpectedError(async () => {
    const deckId = parsePositiveInteger(id);
    if (!deckId) throw new Error('Invalid deck ID.');
    await changeDeckStatus(deckId, await getCurrentUserId(), 'deleted');
    revalidatePath('/decks');
    revalidatePath('/dashboard');
  });
}
