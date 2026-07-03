'use server';

import { getDeckById } from '@/db/queries/deck.queries';
import { getLessonById } from '@/db/queries/lesson.queries';
import { createVocab, getVocabByDeckId, getVocabByLessonId } from '@/db/queries/vocab.queries';
import { createClient } from '@/lib/supabase/server';
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
  return await getCachedVocab(lessonId)();
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
  return await getCachedDeckVocab(deckId)();
};

export async function createVocabAction(vocab: CreateVocab) {
  const { front, back, lessonId, reading } = vocab;

  if (typeof front !== 'string' || front.trim().length === 0) {
    throw new Error('Front text is required.');
  }

  if (typeof back !== 'string' || back.trim().length === 0) {
    throw new Error('Back text is required.');
  }

  if (typeof lessonId !== 'number' || !Number.isInteger(lessonId) || lessonId <= 0) {
    throw new Error('Invalid lesson ID.');
  }

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
    reading: typeof reading === 'string' ? reading.trim() : undefined,
  });
  revalidateTag(`${VOCABS_CACHE_TAG}-deck-${lesson.deckId}`);
  revalidateTag(`${VOCABS_CACHE_TAG}-${lessonId}`);
}
