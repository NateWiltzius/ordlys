import type { Vocab } from '@/types/vocab.types';

type SrsState = {
  srsLevel: number;
  dueAt: string;
};

export type SerializedVocab = Omit<Vocab, 'createdAt' | 'removedAt' | 'updatedAt'> & {
  createdAt: string;
  removedAt: string | null;
  updatedAt: string;
};

export type VocabularyResponse = {
  vocabs: SerializedVocab[];
  srsStates: Record<number, SrsState>;
};

export function serializeVocab(vocab: Vocab): SerializedVocab {
  return {
    ...vocab,
    createdAt: vocab.createdAt.toISOString(),
    removedAt: vocab.removedAt?.toISOString() ?? null,
    updatedAt: vocab.updatedAt.toISOString(),
  };
}

export function deserializeVocab(vocab: SerializedVocab): Vocab {
  return {
    ...vocab,
    createdAt: new Date(vocab.createdAt),
    removedAt: vocab.removedAt ? new Date(vocab.removedAt) : null,
    updatedAt: new Date(vocab.updatedAt),
  };
}
