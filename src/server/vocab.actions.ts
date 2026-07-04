'use server';

import { getDeckById } from '@/db/queries/deck.queries';
import { getLessonById } from '@/db/queries/lesson.queries';
import {
  createVocab,
  getVocabByDeckId,
  getVocabById,
  moveVocab,
  updateVocab,
} from '@/db/queries/vocab.queries';
import { createClient } from '@/lib/supabase/server';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { CreateVocab, UpdateVocabInput, Vocab } from '@/types/vocab.types';
import { revalidatePath } from 'next/cache';
import { OrderDirection } from '@/types/order.types';

export const getVocabsByDeckAction = async (deckId: number): Promise<Vocab[]> => {
  const parsedDeckId = parsePositiveInteger(deckId);
  if (!parsedDeckId) {
    throw new Error('Invalid deck ID.');
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error('User must be authenticated to view vocabulary.');
  }

  const deck = await getDeckById(parsedDeckId);
  if (!deck || deck.deletedAt || deck.ownerId !== data.user.id) {
    throw new Error('Deck not found or access denied.');
  }

  return await getVocabByDeckId(parsedDeckId);
};

export async function createVocabAction(vocab: CreateVocab) {
  const { front, back, frontAlternatives, backAlternatives, lessonId, reading } = vocab;

  if (typeof front !== 'string' || front.trim().length === 0) {
    throw new Error('Front text is required.');
  }

  if (typeof back !== 'string' || back.trim().length === 0) {
    throw new Error('Back text is required.');
  }

  if (typeof lessonId !== 'number' || !Number.isInteger(lessonId) || lessonId <= 0) {
    throw new Error('Invalid lesson ID.');
  }

  const normalizedFrontAlternatives = normalizeAlternatives(frontAlternatives, front);
  const normalizedBackAlternatives = normalizeAlternatives(backAlternatives, back);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error('User must be authenticated to create a lesson.');
  }

  const lesson = await getLessonById(lessonId);
  if (!lesson) {
    throw new Error('Lesson not found.');
  }

  const deck = await getDeckById(lesson.deckId);
  if (!deck || deck.deletedAt) {
    throw new Error('Deck not found.');
  }

  if (deck.ownerId !== data.user.id) {
    throw new Error('Not authorized to create vocab for this lesson.');
  }

  await createVocab({
    lessonId,
    front: front.trim(),
    back: back.trim(),
    frontAlternatives: normalizedFrontAlternatives,
    backAlternatives: normalizedBackAlternatives,
    reading: typeof reading === 'string' ? reading.trim() : undefined,
  });
  revalidatePath(`/decks/${lesson.deckId}/edit`);
}

export async function moveVocabAction(vocabId: number, direction: OrderDirection) {
  if (typeof vocabId !== 'number' || !Number.isInteger(vocabId) || vocabId <= 0) {
    throw new Error('Invalid vocabulary ID.');
  }

  if (direction !== 'up' && direction !== 'down') {
    throw new Error('Invalid move direction.');
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error('User must be authenticated to reorder vocabulary.');
  }

  const deckId = await moveVocab(vocabId, data.user.id, direction);
  revalidatePath(`/decks/${deckId}`);
  revalidatePath(`/decks/${deckId}/edit`);
}

export async function updateVocabAction(vocabId: number, vocab: UpdateVocabInput) {
  if (typeof vocabId !== 'number' || !Number.isInteger(vocabId) || vocabId <= 0) {
    throw new Error('Invalid vocabulary ID.');
  }

  const { front, back, frontAlternatives, backAlternatives, reading } = vocab;

  if (typeof front !== 'string' || front.trim().length === 0) {
    throw new Error('Front text is required.');
  }

  if (typeof back !== 'string' || back.trim().length === 0) {
    throw new Error('Back text is required.');
  }

  const normalizedFrontAlternatives = normalizeAlternatives(frontAlternatives, front);
  const normalizedBackAlternatives = normalizeAlternatives(backAlternatives, back);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error('User must be authenticated to update vocabulary.');
  }

  const existingVocab = await getVocabById(vocabId);
  const lesson = existingVocab ? await getLessonById(existingVocab.lessonId) : undefined;
  const deck = lesson ? await getDeckById(lesson.deckId) : undefined;

  if (!existingVocab || !lesson || !deck || deck.deletedAt || deck.ownerId !== data.user.id) {
    throw new Error('Vocabulary not found or access denied.');
  }

  await updateVocab(vocabId, {
    front: front.trim(),
    back: back.trim(),
    frontAlternatives: normalizedFrontAlternatives,
    backAlternatives: normalizedBackAlternatives,
    reading: typeof reading === 'string' && reading.trim() ? reading.trim() : null,
  });

  revalidatePath(`/decks/${lesson.deckId}`);
  revalidatePath(`/decks/${lesson.deckId}/edit`);
}

function normalizeAlternatives(
  alternatives: string[] | undefined,
  canonicalAnswer: string,
): string[] {
  if (alternatives === undefined) {
    return [];
  }

  if (!Array.isArray(alternatives) || alternatives.length > 20) {
    throw new Error('Alternatives must contain at most 20 answers.');
  }

  const canonicalNormalized = canonicalAnswer.trim().normalize('NFKC').toLowerCase();
  const uniqueAlternatives = new Map<string, string>();

  for (const alternative of alternatives) {
    if (typeof alternative !== 'string') {
      throw new Error('Each alternative must be text.');
    }

    const trimmedAlternative = alternative.trim();
    if (!trimmedAlternative) continue;
    if (trimmedAlternative.length > 255) {
      throw new Error('Each alternative must be 255 characters or fewer.');
    }

    const normalizedAlternative = trimmedAlternative.normalize('NFKC').toLowerCase();
    if (normalizedAlternative !== canonicalNormalized) {
      uniqueAlternatives.set(normalizedAlternative, trimmedAlternative);
    }
  }

  return [...uniqueAlternatives.values()];
}
