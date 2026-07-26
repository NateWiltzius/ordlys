'use server';

import {
  createDeck,
  getDeckCardStudyCounts,
  getDecksByOwnerId,
  getOwnedDeckById,
  getPublicDecks,
  getRestorableDecksByOwnerId,
  getUserActiveDecks,
  getUserFollowedDecks,
  updateDeck,
} from '@/db/queries/deck.queries';
import { changeDeckStatus } from '@/db/queries/deck-release.queries';
import { CreateDeck, CreateDeckInput } from '@/types/deck.types';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getCurrentUserId } from '@/lib/auth/get-current-user-id';
import {
  CONTENT_LIMITS,
  optionalLanguageTag,
  optionalText,
  requiredText,
} from '@/lib/validation/content';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { getEditLessonSummaries } from '@/db/queries/lesson.queries';
import {
  getNewVocabCountsForDecks,
  getNextReviewBatch,
  getReviewForecastCounts,
} from '@/db/queries/review.queries';
import { buildReviewForecast } from '@/lib/review-forecast';
import {
  getDeckProvenance,
  getRemovedDraftItems,
  hasUnpublishedDraftChanges,
  listReleaseHistory,
} from '@/db/queries/deck-release.queries';
import { withExpectedError } from '@/lib/action-result';
import { PUBLIC_DECK_SUMMARIES_CACHE_TAG } from '@/lib/cache-tags';
import type { ReviewCounts } from '@/types/review.types';

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

  const deckStats: Record<number, ReviewCounts> = Object.fromEntries(
    activeDeckIds.map(deckId => [
      deckId,
      {
        totalWords: deckStudyCounts[deckId]?.totalWords ?? 0,
        newWordsAvailable: newVocabCounts[deckId] ?? 0,
        reviewsDue: deckStudyCounts[deckId]?.reviewsDue ?? 0,
        wordsInReview: deckStudyCounts[deckId]?.wordsInReview ?? 0,
      },
    ]),
  );
  const allDeckStats = Object.values(deckStats).reduce(
    (totals, stats) => ({
      totalWords: totals.totalWords + stats.totalWords,
      newWordsAvailable: totals.newWordsAvailable + stats.newWordsAvailable,
      reviewsDue: totals.reviewsDue + stats.reviewsDue,
      wordsInReview: totals.wordsInReview + stats.wordsInReview,
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

export async function getLibraryPageDataAction() {
  const userId = await getCurrentUserId();
  const [ownedDecks, learningDecks, restorableDecks] = await Promise.all([
    getDecksByOwnerId(userId),
    getUserFollowedDecks(userId),
    getRestorableDecksByOwnerId(userId),
  ]);
  const activeDeckIds = [...new Set([...ownedDecks, ...learningDecks].map(deck => deck.id))];
  const [deckStudyCounts, newVocabCounts] = await Promise.all([
    getDeckCardStudyCounts(activeDeckIds, userId),
    getNewVocabCountsForDecks(activeDeckIds, userId),
  ]);
  const deckStats = Object.fromEntries(
    activeDeckIds.map(deckId => [
      deckId,
      {
        totalWords: deckStudyCounts[deckId]?.totalWords ?? 0,
        reviewsDue: deckStudyCounts[deckId]?.reviewsDue ?? 0,
        wordsInReview: deckStudyCounts[deckId]?.wordsInReview ?? 0,
        newWordsAvailable: newVocabCounts[deckId] ?? 0,
      },
    ]),
  );

  return { ownedDecks, learningDecks, restorableDecks, deckStats };
}

export async function getDiscoverPageDataAction() {
  const userId = await getCurrentUserId();
  const [ownedDecks, publicDecks, learningDecks] = await Promise.all([
    getDecksByOwnerId(userId),
    getPublicDecks(),
    getUserFollowedDecks(userId),
  ]);
  return {
    publicDecks,
    ownedDeckIds: ownedDecks.map(deck => deck.id),
    followingDeckIds: learningDecks.map(deck => deck.id),
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

    const deckId = await createDeck(deckWithOwner);
    revalidatePath('/decks');
    return deckId;
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
    revalidatePath('/discover');
    revalidateTag(PUBLIC_DECK_SUMMARIES_CACHE_TAG);
  });
}

export async function deleteDeckAction(id: number) {
  return withExpectedError(async () => {
    const deckId = parsePositiveInteger(id);
    if (!deckId) throw new Error('Invalid deck ID.');
    await changeDeckStatus(deckId, await getCurrentUserId(), 'deleted');
    revalidateTag(PUBLIC_DECK_SUMMARIES_CACHE_TAG);
    revalidatePath('/decks');
    revalidatePath('/dashboard');
    revalidatePath('/progress');
    revalidatePath('/discover');
  });
}
