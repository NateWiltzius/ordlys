'use server';

import { getDeckById } from '@/db/queries/deck.queries';
import { getLessonById } from '@/db/queries/lesson.queries';
import { createVocab, getVocabByDeckId, getVocabByLessonId } from '@/db/queries/vocab.queries';
import { createClient } from '@/lib/supabase/server';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { CreateVocab, Vocab } from '@/types/vocab.types';
import { revalidateTag, unstable_cache } from 'next/cache';

const VOCABS_CACHE_TAG = 'vocabs';

const getCachedVocab = (lessonId: number): (() => Promise<Vocab[]>) =>
  unstable_cache(
    async () => {
      return await getVocabByLessonId(lessonId);
    },
    ['vocab-list', String(lessonId)],
    {
      tags: [`${VOCABS_CACHE_TAG}-${lessonId}`],
      revalidate: 1,
    },
  );

export const getVocabAction = async (lessonId: number): Promise<Vocab[]> => {
  const parsedLessonId = parsePositiveInteger(lessonId);
  if (!parsedLessonId) {
    throw new Error('Invalid lesson ID.');
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error('User must be authenticated to view vocabulary.');
  }

  const lesson = await getLessonById(parsedLessonId);
  const deck = lesson ? await getDeckById(lesson.deckId) : undefined;
  if (!lesson || !deck || deck.ownerId !== data.user.id) {
    throw new Error('Lesson not found or access denied.');
  }

  return await getCachedVocab(parsedLessonId)();
};

const getCachedDeckVocab = (deckId: number): (() => Promise<Vocab[]>) =>
  unstable_cache(
    async () => {
      return await getVocabByDeckId(deckId);
    },
    ['deck-vocab-list', String(deckId)],
    {
      tags: [`${VOCABS_CACHE_TAG}-deck-${deckId}`],
      revalidate: 1,
    },
  );

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
  if (!deck || deck.ownerId !== data.user.id) {
    throw new Error('Deck not found or access denied.');
  }

  return await getCachedDeckVocab(parsedDeckId)();
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
  if (!deck) {
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
  revalidateTag(`${VOCABS_CACHE_TAG}-deck-${lesson.deckId}`);
  revalidateTag(`${VOCABS_CACHE_TAG}-${lessonId}`);
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
