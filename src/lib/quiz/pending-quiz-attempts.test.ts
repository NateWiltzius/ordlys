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
  releaseId: 7,
  mode: 'review',
  direction: 'ftb',
  isCorrect: true,
  wasOverridden: false,
  sessionId: '22345678-1234-4234-8234-123456789abc',
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

  it('keeps legacy pending attempts that predate release-bound saving', () => {
    const legacyAttempt: SaveQuizAttemptInput = { ...attempt };
    delete legacyAttempt.releaseId;
    values.set(STORAGE_KEY, JSON.stringify([legacyAttempt]));

    expect(readPendingQuizAttempts()).toEqual([legacyAttempt]);
  });

  it('ignores malformed stored values', () => {
    values.set(
      STORAGE_KEY,
      JSON.stringify([
        { ...attempt, vocabId: 0 },
        { ...attempt, releaseId: 0 },
        { ...attempt, sessionId: 'not-a-uuid' },
        attempt,
      ]),
    );

    expect(readPendingQuizAttempts()).toEqual([attempt]);
  });

  it('clears pending attempts after sign-out or successful saving', () => {
    writePendingQuizAttempts([attempt]);
    clearPendingQuizAttempts();

    expect(readPendingQuizAttempts()).toEqual([]);
  });
});
