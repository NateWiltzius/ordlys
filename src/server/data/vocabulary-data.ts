import 'server-only';

import { getActiveReleaseId } from '@/db/queries/deck-access';
import { getAccessibleDeckById, getOwnedDeckById } from '@/db/queries/deck.queries';
import { getReleaseDeckVocabs, getReleaseLessonVocabs } from '@/db/queries/deck-release.queries';
import { getLessonById } from '@/db/queries/lesson.queries';
import {
  getUserVocabStatesByDeckId,
  getUserVocabStatesByLessonId,
  getVocabByDeckId,
  getVocabByLessonId,
} from '@/db/queries/vocab.queries';
import { getCurrentUserId } from '@/lib/auth/get-current-user-id';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';

export async function getLessonVocabularyData(deckId: number, lessonId: number) {
  const parsedDeckId = parsePositiveInteger(deckId);
  const parsedLessonId = parsePositiveInteger(lessonId);
  if (!parsedDeckId || !parsedLessonId) throw new Error('Invalid deck or lesson ID.');

  const userId = await getCurrentUserId();
  const [deck, lesson] = await Promise.all([
    getAccessibleDeckById(parsedDeckId, userId),
    getLessonById(parsedLessonId),
  ]);

  if (!deck || !lesson || lesson.deckId !== deck.id) {
    throw new Error('Lesson not found or access denied.');
  }

  const releaseId = await getActiveReleaseId(parsedDeckId, userId, true);
  if (!releaseId) throw new Error('Deck has no accessible release.');
  const [lessonVocabs, userVocabStates] = await Promise.all([
    getReleaseLessonVocabs(releaseId, parsedLessonId),
    getUserVocabStatesByLessonId(parsedLessonId, userId),
  ]);

  return {
    vocabs: lessonVocabs,
    srsStates: Object.fromEntries(
      userVocabStates.map(state => [
        state.vocabId,
        { srsLevel: state.srsLevel, dueAt: state.dueAt.toISOString() },
      ]),
    ),
  };
}

export async function getEditableLessonVocabularyData(deckId: number, lessonId: number) {
  const parsedDeckId = parsePositiveInteger(deckId);
  const parsedLessonId = parsePositiveInteger(lessonId);
  if (!parsedDeckId || !parsedLessonId) throw new Error('Invalid deck or lesson ID.');

  const userId = await getCurrentUserId();
  const [deck, lesson] = await Promise.all([
    getOwnedDeckById(parsedDeckId, userId),
    getLessonById(parsedLessonId),
  ]);

  if (!deck || !lesson || lesson.deckId !== deck.id || lesson.removedAt) {
    throw new Error('Lesson not found or access denied.');
  }

  return getVocabByLessonId(parsedLessonId);
}

export async function getDeckVocabularyForSearchData(deckId: number) {
  const parsedDeckId = parsePositiveInteger(deckId);
  if (!parsedDeckId) throw new Error('Invalid deck ID.');

  const userId = await getCurrentUserId();
  const deck = await getAccessibleDeckById(parsedDeckId, userId);
  if (!deck) throw new Error('Deck not found or access denied.');

  const releaseId = await getActiveReleaseId(parsedDeckId, userId, true);
  if (!releaseId) throw new Error('Deck has no accessible release.');

  const [vocabs, userVocabStates] = await Promise.all([
    getReleaseDeckVocabs(releaseId),
    getUserVocabStatesByDeckId(parsedDeckId, userId),
  ]);

  return {
    vocabs,
    srsStates: Object.fromEntries(
      userVocabStates.map(state => [
        state.vocabId,
        { srsLevel: state.srsLevel, dueAt: state.dueAt.toISOString() },
      ]),
    ),
  };
}

export async function getEditableDeckVocabularyForSearchData(deckId: number) {
  const parsedDeckId = parsePositiveInteger(deckId);
  if (!parsedDeckId) throw new Error('Invalid deck ID.');

  const userId = await getCurrentUserId();
  const deck = await getOwnedDeckById(parsedDeckId, userId);
  if (!deck) throw new Error('Deck not found or access denied.');

  return getVocabByDeckId(parsedDeckId);
}
