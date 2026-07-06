'use server';

import {
  createDeck,
  deleteDeck,
  getAccessibleDeckById,
  getDeckCardStudyCounts,
  getDecksByOwnerId,
  getDeckStudyCounts,
  getOwnedDeckById,
  getPublicDecks,
  getUserActiveDecks,
  getUserSubscribedDecks,
  updateDeck,
} from '@/db/queries/deck.queries';
import { CreateDeck, CreateDeckInput } from '@/types/deck.types';
import { revalidatePath } from 'next/cache';
import { getCurrentUserId } from '@/lib/auth/get-current-user-id';
import {
  CONTENT_LIMITS,
  optionalLanguageTag,
  optionalText,
  requiredText,
} from '@/lib/validation/content';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { hasDeckSubscription } from '@/db/queries/deck-subscription.queries';
import { getLessonsByDeckId } from '@/db/queries/lesson.queries';
import { getVocabByDeckId } from '@/db/queries/vocab.queries';
import {
  getNewVocabCountsForDecks,
  getNextReviewBatch,
  getReviewForecastCounts,
} from '@/db/queries/review.queries';
import { buildReviewForecast } from '@/lib/review-forecast';

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
  const [ownedDecks, publicDecks, learningDecks] = await Promise.all([
    getDecksByOwnerId(userId),
    getPublicDecks(userId),
    getUserSubscribedDecks(userId),
  ]);
  return { ownedDecks, publicDecks, learningDecks };
}

export async function getDeckPageDataAction(id: number) {
  const deckId = parsePositiveInteger(id);
  if (!deckId) throw new Error('Invalid deck ID.');
  const userId = await getCurrentUserId();
  const [deck, isSubscribed, forecastCounts, nextReview] = await Promise.all([
    getAccessibleDeckById(deckId, userId),
    hasDeckSubscription(deckId, userId),
    getReviewForecastCounts(userId, [deckId]),
    getNextReviewBatch(userId, [deckId]),
  ]);
  if (!deck) return null;
  const isOwned = deck.ownerId === userId;
  return {
    deck,
    isOwned,
    isSubscribed,
    canStudy: isOwned || isSubscribed,
    reviewForecast: buildReviewForecast(forecastCounts),
    nextReview,
  };
}

export async function getEditDeckPageDataAction(id: number) {
  const deckId = parsePositiveInteger(id);
  if (!deckId) throw new Error('Invalid deck ID.');
  const userId = await getCurrentUserId();
  const deck = await getOwnedDeckById(deckId, userId);
  if (!deck) return null;
  const [lessons, vocabs] = await Promise.all([
    getLessonsByDeckId(deckId),
    getVocabByDeckId(deckId),
  ]);
  return { deck, lessons, vocabs };
}

export async function getDeckStudyCountsAction(id: number) {
  const deckId = parsePositiveInteger(id);
  if (!deckId) throw new Error('Invalid deck ID.');
  return await getDeckStudyCounts(deckId, await getCurrentUserId());
}

export const createDeckAction = async (deck: CreateDeckInput): Promise<void> => {
  const userId = await getCurrentUserId();
  if (!deck || typeof deck !== 'object') throw new Error('Invalid deck.');
  if (deck.visibility !== 'public' && deck.visibility !== 'private') {
    throw new Error('Visibility must be public or private.');
  }
  const deckWithOwner: CreateDeck = {
    title: requiredText(deck.title, 'Deck title', CONTENT_LIMITS.deckTitle),
    description: optionalText(deck.description, 'Description', CONTENT_LIMITS.deckDescription),
    frontLanguage: optionalLanguageTag(deck.frontLanguage, 'Front language'),
    backLanguage: optionalLanguageTag(deck.backLanguage, 'Back language'),
    visibility: deck.visibility,
    ownerId: userId,
  };

  await createDeck(deckWithOwner);
  revalidatePath('/decks');
};

export async function updateDeckAction(id: number, input: CreateDeckInput): Promise<void> {
  const deckId = parsePositiveInteger(id);
  if (!deckId || !input || typeof input !== 'object') throw new Error('Invalid deck.');
  if (input.visibility !== 'public' && input.visibility !== 'private') {
    throw new Error('Visibility must be public or private.');
  }
  const userId = await getCurrentUserId();
  await updateDeck(deckId, userId, {
    title: requiredText(input.title, 'Deck title', CONTENT_LIMITS.deckTitle),
    description: optionalText(input.description, 'Description', CONTENT_LIMITS.deckDescription),
    frontLanguage: optionalLanguageTag(input.frontLanguage, 'Front language'),
    backLanguage: optionalLanguageTag(input.backLanguage, 'Back language'),
    visibility: input.visibility,
  });
  revalidatePath('/decks');
  revalidatePath(`/decks/${deckId}`);
  revalidatePath(`/decks/${deckId}/edit`);
}

export const deleteDeckAction = async (id: number): Promise<void> => {
  const deckId = parsePositiveInteger(id);
  if (!deckId) throw new Error('Invalid deck ID.');
  await deleteDeck(deckId, await getCurrentUserId());
  revalidatePath('/decks');
  revalidatePath('/dashboard');
};
