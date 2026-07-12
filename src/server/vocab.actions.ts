'use server';

import { getAccessibleDeckById, getOwnedDeckById } from '@/db/queries/deck.queries';
import { getActiveReleaseId } from '@/db/queries/deck-access';
import { getReleaseLessonVocabs } from '@/db/queries/deck-release.queries';
import { getLessonById } from '@/db/queries/lesson.queries';
import {
  createVocab,
  deleteVocab,
  getVocabByLessonId,
  getUserVocabLevelsByLessonId,
  moveVocab,
  replaceVocab,
  restoreVocab,
  updateVocab,
} from '@/db/queries/vocab.queries';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { CreateVocab, UpdateVocabInput } from '@/types/vocab.types';
import { revalidatePath } from 'next/cache';
import { OrderDirection } from '@/types/order.types';
import { getCurrentUserId } from '@/lib/auth/get-current-user-id';
import { CONTENT_LIMITS, optionalText, requiredText } from '@/lib/validation/content';
import type { JsonValue, VocabMetadata } from '@/db/schema';
import { UserFacingError, withExpectedError } from '@/lib/action-result';

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

  const releaseId = await getActiveReleaseId(parsedDeckId, userId, true);
  if (!releaseId) throw new Error('Deck has no accessible release.');
  const [lessonVocabs, userVocabLevels] = await Promise.all([
    getReleaseLessonVocabs(releaseId, parsedLessonId),
    getUserVocabLevelsByLessonId(parsedLessonId, userId),
  ]);

  return {
    vocabs: lessonVocabs,
    srsLevels: Object.fromEntries(userVocabLevels.map(state => [state.vocabId, state.srsLevel])),
  };
}

export async function getEditableLessonVocabularyAction(deckId: number, lessonId: number) {
  const parsedDeckId = parsePositiveInteger(deckId);
  const parsedLessonId = parsePositiveInteger(lessonId);
  if (!parsedDeckId || !parsedLessonId) {
    throw new Error('Invalid deck or lesson ID.');
  }

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

export async function createVocabAction(vocab: CreateVocab) {
  return withExpectedError(async () => {
    const { front, back, frontAlternatives, backAlternatives, lessonId, reading, tags, metadata } =
      vocab;

    const normalizedFront = requiredText(front, 'Front text', CONTENT_LIMITS.vocabText);
    const normalizedBack = requiredText(back, 'Back text', CONTENT_LIMITS.vocabText);
    const normalizedReading = optionalText(reading, 'Reading', CONTENT_LIMITS.vocabText);
    const normalizedNotes = optionalText(vocab.notes, 'Notes', CONTENT_LIMITS.vocabNotes);

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
        tags: normalizeTags(tags),
        metadata: normalizeMetadata(metadata),
        notes: normalizedNotes,
      },
      await getCurrentUserId(),
    );
    revalidatePath(`/decks/${deckId}/edit`);
  });
}

export async function moveVocabAction(vocabId: number, direction: OrderDirection) {
  return withExpectedError(async () => {
    if (typeof vocabId !== 'number' || !Number.isInteger(vocabId) || vocabId <= 0) {
      throw new Error('Invalid vocabulary ID.');
    }

    if (direction !== 'up' && direction !== 'down') {
      throw new Error('Invalid move direction.');
    }

    const deckId = await moveVocab(vocabId, await getCurrentUserId(), direction);
    revalidatePath(`/decks/${deckId}`);
    revalidatePath(`/decks/${deckId}/edit`);
  });
}

export async function updateVocabAction(vocabId: number, vocab: UpdateVocabInput) {
  return withExpectedError(async () => {
    if (typeof vocabId !== 'number' || !Number.isInteger(vocabId) || vocabId <= 0) {
      throw new Error('Invalid vocabulary ID.');
    }

    const { front, back, frontAlternatives, backAlternatives, reading, tags, metadata } = vocab;

    const normalizedFront = requiredText(front, 'Front text', CONTENT_LIMITS.vocabText);
    const normalizedBack = requiredText(back, 'Back text', CONTENT_LIMITS.vocabText);
    const normalizedReading = optionalText(reading, 'Reading', CONTENT_LIMITS.vocabText);
    const normalizedNotes = optionalText(vocab.notes, 'Notes', CONTENT_LIMITS.vocabNotes);

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
        tags: tags === undefined ? undefined : normalizeTags(tags),
        metadata: metadata === undefined ? undefined : normalizeMetadata(metadata),
        notes: vocab.notes === undefined ? undefined : normalizedNotes,
      },
      await getCurrentUserId(),
    );

    revalidatePath(`/decks/${deckId}`);
    revalidatePath(`/decks/${deckId}/edit`);
  });
}

export async function deleteVocabAction(vocabId: number) {
  return withExpectedError(async () => {
    const parsedVocabId = parsePositiveInteger(vocabId);
    if (!parsedVocabId) throw new Error('Invalid vocabulary ID.');
    const deckId = await deleteVocab(parsedVocabId, await getCurrentUserId());
    revalidatePath(`/decks/${deckId}`);
    revalidatePath(`/decks/${deckId}/edit`);
  });
}

export async function replaceVocabAction(vocabId: number, vocab: UpdateVocabInput) {
  return withExpectedError(async () => {
    const parsedVocabId = parsePositiveInteger(vocabId);
    if (!parsedVocabId) throw new Error('Invalid vocabulary ID.');
    const normalized: UpdateVocabInput = {
      front: requiredText(vocab.front, 'Front text', CONTENT_LIMITS.vocabText),
      back: requiredText(vocab.back, 'Back text', CONTENT_LIMITS.vocabText),
      frontAlternatives: normalizeAlternatives(vocab.frontAlternatives, vocab.front),
      backAlternatives: normalizeAlternatives(vocab.backAlternatives, vocab.back),
      reading: optionalText(vocab.reading, 'Reading', CONTENT_LIMITS.vocabText),
      tags: normalizeTags(vocab.tags),
      metadata: normalizeMetadata(vocab.metadata),
      notes: optionalText(vocab.notes, 'Notes', CONTENT_LIMITS.vocabNotes),
    };
    const result = await replaceVocab(parsedVocabId, normalized, await getCurrentUserId());
    revalidatePath(`/decks/${result.deckId}`);
    revalidatePath(`/decks/${result.deckId}/edit`);
    return result.vocabId;
  });
}

export async function restoreVocabAction(vocabId: number) {
  return withExpectedError(async () => {
    const parsedVocabId = parsePositiveInteger(vocabId);
    if (!parsedVocabId) throw new Error('Invalid vocabulary ID.');
    const deckId = await restoreVocab(parsedVocabId, await getCurrentUserId());
    revalidatePath(`/decks/${deckId}/edit`);
  });
}

function normalizeAlternatives(
  alternatives: string[] | undefined,
  canonicalAnswer: string,
): string[] {
  if (alternatives === undefined) {
    return [];
  }

  if (!Array.isArray(alternatives) || alternatives.length > CONTENT_LIMITS.alternatives) {
    throw new UserFacingError(
      'VALIDATION_ERROR',
      `Alternatives must contain at most ${CONTENT_LIMITS.alternatives} answers.`,
    );
  }

  const canonicalNormalized = canonicalAnswer.trim().normalize('NFKC').toLowerCase();
  const uniqueAlternatives = new Map<string, string>();

  for (const alternative of alternatives) {
    if (typeof alternative !== 'string') {
      throw new UserFacingError('VALIDATION_ERROR', 'Each alternative must be text.');
    }

    const trimmedAlternative = alternative.trim();
    if (!trimmedAlternative) continue;
    if (trimmedAlternative.length > CONTENT_LIMITS.vocabText) {
      throw new UserFacingError(
        'VALIDATION_ERROR',
        `Each alternative must be ${CONTENT_LIMITS.vocabText} characters or fewer.`,
      );
    }

    const normalizedAlternative = trimmedAlternative.normalize('NFKC').toLowerCase();
    if (normalizedAlternative !== canonicalNormalized) {
      uniqueAlternatives.set(normalizedAlternative, trimmedAlternative);
    }
  }

  return [...uniqueAlternatives.values()];
}

function normalizeTags(tags: string[] | undefined): string[] {
  if (tags === undefined) {
    return [];
  }

  if (!Array.isArray(tags)) {
    throw new UserFacingError('VALIDATION_ERROR', 'Tags must be a list of text values.');
  }

  const uniqueTags = new Map<string, string>();
  for (const tag of tags) {
    if (typeof tag !== 'string') {
      throw new UserFacingError('VALIDATION_ERROR', 'Each tag must be text.');
    }

    const normalizedTag = tag.trim();
    if (!normalizedTag) continue;
    if (normalizedTag.length > CONTENT_LIMITS.vocabTag) {
      throw new UserFacingError(
        'VALIDATION_ERROR',
        `Each tag must be ${CONTENT_LIMITS.vocabTag} characters or fewer.`,
      );
    }

    uniqueTags.set(normalizedTag.normalize('NFKC').toLowerCase(), normalizedTag);
  }

  return [...uniqueTags.values()];
}

function normalizeMetadata(metadata: VocabMetadata | null | undefined): VocabMetadata {
  if (metadata === undefined || metadata === null) {
    return {};
  }

  if (!isPlainObject(metadata)) {
    throw new UserFacingError('VALIDATION_ERROR', 'Metadata must be an object.');
  }

  for (const value of Object.values(metadata)) {
    if (!isJsonValue(value)) {
      throw new UserFacingError('VALIDATION_ERROR', 'Metadata must contain only JSON values.');
    }
  }

  return metadata;
}

function isJsonValue(value: unknown): value is JsonValue {
  if (value === null) return true;
  if (['string', 'number', 'boolean'].includes(typeof value)) return true;
  if (Array.isArray(value)) return value.every(isJsonValue);
  if (isPlainObject(value)) return Object.values(value).every(isJsonValue);
  return false;
}

function isPlainObject(value: unknown): value is Record<string, JsonValue> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
