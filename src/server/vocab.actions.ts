'use server';

import { getAccessibleDeckById } from '@/db/queries/deck.queries';
import { getLessonById } from '@/db/queries/lesson.queries';
import {
  createVocab,
  deleteVocab,
  getVocabByLessonId,
  getUserVocabLevelsByLessonId,
  moveVocab,
  updateVocab,
} from '@/db/queries/vocab.queries';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { CreateVocab, UpdateVocabInput } from '@/types/vocab.types';
import { revalidatePath } from 'next/cache';
import { OrderDirection } from '@/types/order.types';
import { getCurrentUserId } from '@/lib/auth/get-current-user-id';
import { CONTENT_LIMITS, optionalText, requiredText } from '@/lib/validation/content';

export async function getLessonVocabularyAction(deckId: number, lessonId: number) {
  const parsedDeckId = parsePositiveInteger(deckId);
  const parsedLessonId = parsePositiveInteger(lessonId);
  if (!parsedDeckId || !parsedLessonId) {
    throw new Error('Invalid deck or lesson ID.');
  }

  const userId = await getCurrentUserId();
  const [deck, lesson] = await Promise.all([
    getAccessibleDeckById(parsedDeckId, userId),
    getLessonById(parsedLessonId),
  ]);

  if (!deck || !lesson || lesson.deckId !== deck.id) {
    throw new Error('Lesson not found or access denied.');
  }

  const [lessonVocabs, userVocabLevels] = await Promise.all([
    getVocabByLessonId(parsedLessonId),
    getUserVocabLevelsByLessonId(parsedLessonId, userId),
  ]);

  return {
    vocabs: lessonVocabs,
    srsLevels: Object.fromEntries(userVocabLevels.map(state => [state.vocabId, state.srsLevel])),
  };
}

export async function createVocabAction(vocab: CreateVocab) {
  const { front, back, frontAlternatives, backAlternatives, lessonId, reading } = vocab;

  const normalizedFront = requiredText(front, 'Front text', CONTENT_LIMITS.vocabText);
  const normalizedBack = requiredText(back, 'Back text', CONTENT_LIMITS.vocabText);
  const normalizedReading = optionalText(reading, 'Reading', CONTENT_LIMITS.vocabText);

  if (typeof lessonId !== 'number' || !Number.isInteger(lessonId) || lessonId <= 0) {
    throw new Error('Invalid lesson ID.');
  }

  const normalizedFrontAlternatives = normalizeAlternatives(frontAlternatives, normalizedFront);
  const normalizedBackAlternatives = normalizeAlternatives(backAlternatives, normalizedBack);

  const deckId = await createVocab(
    {
      lessonId,
      front: normalizedFront,
      back: normalizedBack,
      frontAlternatives: normalizedFrontAlternatives,
      backAlternatives: normalizedBackAlternatives,
      reading: normalizedReading,
    },
    await getCurrentUserId(),
  );
  revalidatePath(`/decks/${deckId}/edit`);
}

export async function moveVocabAction(vocabId: number, direction: OrderDirection) {
  if (typeof vocabId !== 'number' || !Number.isInteger(vocabId) || vocabId <= 0) {
    throw new Error('Invalid vocabulary ID.');
  }

  if (direction !== 'up' && direction !== 'down') {
    throw new Error('Invalid move direction.');
  }

  const deckId = await moveVocab(vocabId, await getCurrentUserId(), direction);
  revalidatePath(`/decks/${deckId}`);
  revalidatePath(`/decks/${deckId}/edit`);
}

export async function updateVocabAction(vocabId: number, vocab: UpdateVocabInput) {
  if (typeof vocabId !== 'number' || !Number.isInteger(vocabId) || vocabId <= 0) {
    throw new Error('Invalid vocabulary ID.');
  }

  const { front, back, frontAlternatives, backAlternatives, reading } = vocab;

  const normalizedFront = requiredText(front, 'Front text', CONTENT_LIMITS.vocabText);
  const normalizedBack = requiredText(back, 'Back text', CONTENT_LIMITS.vocabText);
  const normalizedReading = optionalText(reading, 'Reading', CONTENT_LIMITS.vocabText);

  const normalizedFrontAlternatives = normalizeAlternatives(frontAlternatives, normalizedFront);
  const normalizedBackAlternatives = normalizeAlternatives(backAlternatives, normalizedBack);

  const deckId = await updateVocab(
    vocabId,
    {
      front: normalizedFront,
      back: normalizedBack,
      frontAlternatives: normalizedFrontAlternatives,
      backAlternatives: normalizedBackAlternatives,
      reading: normalizedReading,
    },
    await getCurrentUserId(),
  );

  revalidatePath(`/decks/${deckId}`);
  revalidatePath(`/decks/${deckId}/edit`);
}

export async function deleteVocabAction(vocabId: number) {
  const parsedVocabId = parsePositiveInteger(vocabId);
  if (!parsedVocabId) throw new Error('Invalid vocabulary ID.');
  const deckId = await deleteVocab(parsedVocabId, await getCurrentUserId());
  revalidatePath(`/decks/${deckId}`);
  revalidatePath(`/decks/${deckId}/edit`);
}

function normalizeAlternatives(
  alternatives: string[] | undefined,
  canonicalAnswer: string,
): string[] {
  if (alternatives === undefined) {
    return [];
  }

  if (!Array.isArray(alternatives) || alternatives.length > CONTENT_LIMITS.alternatives) {
    throw new Error(`Alternatives must contain at most ${CONTENT_LIMITS.alternatives} answers.`);
  }

  const canonicalNormalized = canonicalAnswer.trim().normalize('NFKC').toLowerCase();
  const uniqueAlternatives = new Map<string, string>();

  for (const alternative of alternatives) {
    if (typeof alternative !== 'string') {
      throw new Error('Each alternative must be text.');
    }

    const trimmedAlternative = alternative.trim();
    if (!trimmedAlternative) continue;
    if (trimmedAlternative.length > CONTENT_LIMITS.vocabText) {
      throw new Error(`Each alternative must be ${CONTENT_LIMITS.vocabText} characters or fewer.`);
    }

    const normalizedAlternative = trimmedAlternative.normalize('NFKC').toLowerCase();
    if (normalizedAlternative !== canonicalNormalized) {
      uniqueAlternatives.set(normalizedAlternative, trimmedAlternative);
    }
  }

  return [...uniqueAlternatives.values()];
}
