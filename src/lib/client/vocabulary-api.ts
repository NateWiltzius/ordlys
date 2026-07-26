import 'client-only';

import {
  deserializeVocab,
  type SerializedVocab,
  type VocabularyResponse,
} from '@/lib/vocab/vocab-transport';
import type { Vocab } from '@/types/vocab.types';

type VocabularyData = Omit<VocabularyResponse, 'vocabs'> & {
  vocabs: Vocab[];
};

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { cache: 'no-store', signal });
  if (!response.ok) throw new Error(`Request failed with status ${response.status}.`);
  return (await response.json()) as T;
}

function deserializeVocabularyResponse(response: VocabularyResponse): VocabularyData {
  return {
    ...response,
    vocabs: response.vocabs.map(deserializeVocab),
  };
}

export async function getLessonVocabulary(
  deckId: number,
  lessonId: number,
  signal?: AbortSignal,
): Promise<VocabularyData> {
  const query = new URLSearchParams({ lessonId: String(lessonId) });
  const response = await getJson<VocabularyResponse>(
    `/api/decks/${deckId}/vocabulary?${query}`,
    signal,
  );
  return deserializeVocabularyResponse(response);
}

export async function getDeckVocabularyForSearch(
  deckId: number,
  signal?: AbortSignal,
): Promise<VocabularyData> {
  const response = await getJson<VocabularyResponse>(`/api/decks/${deckId}/vocabulary`, signal);
  return deserializeVocabularyResponse(response);
}

export async function getEditableLessonVocabulary(
  deckId: number,
  lessonId: number,
  signal?: AbortSignal,
): Promise<Vocab[]> {
  const query = new URLSearchParams({ lessonId: String(lessonId) });
  const response = await getJson<SerializedVocab[]>(
    `/api/decks/${deckId}/editable-vocabulary?${query}`,
    signal,
  );
  return response.map(deserializeVocab);
}

export async function getEditableDeckVocabularyForSearch(
  deckId: number,
  signal?: AbortSignal,
): Promise<Vocab[]> {
  const response = await getJson<SerializedVocab[]>(
    `/api/decks/${deckId}/editable-vocabulary`,
    signal,
  );
  return response.map(deserializeVocab);
}
