import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearPendingQuizAttempts,
  readPendingQuizAttempts,
  writePendingQuizAttempts,
} from './pending-quiz-attempts';
import type { SaveQuizAttemptInput } from '@/types/quiz.types';

const STORAGE_KEY = 'ordlys.pending-quiz-attempts.v1';
const attempt: SaveQuizAttemptInput = {
  vocabId: 42,
  mode: 'review',
  direction: 'ftb',
  isCorrect: true,
  wasOverridden: false,
  completesCard: true,
  cardWasCorrect: true,
  idempotencyKey: '12345678-1234-4234-8234-123456789abc',
};

describe('pending quiz attempt storage', () => {
  let values: Map<string, string>;

  beforeEach(() => {
    values = new Map();
    vi.stubGlobal('window', {
      sessionStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('round-trips valid pending attempts', () => {
    writePendingQuizAttempts([attempt]);

    expect(readPendingQuizAttempts()).toEqual([attempt]);
  });

  it('ignores malformed stored values', () => {
    values.set(STORAGE_KEY, JSON.stringify([{ ...attempt, vocabId: 0 }, attempt]));

    expect(readPendingQuizAttempts()).toEqual([attempt]);
  });

  it('clears pending attempts after sign-out or successful saving', () => {
    writePendingQuizAttempts([attempt]);
    clearPendingQuizAttempts();

    expect(readPendingQuizAttempts()).toEqual([]);
  });
});
