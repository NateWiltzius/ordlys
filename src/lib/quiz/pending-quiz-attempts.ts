import type { SaveQuizAttemptInput } from '@/types/quiz.types';
import { isUuid } from '../validation/uuid';

const STORAGE_KEY = 'ordlys.pending-quiz-attempts.v1';

export function readPendingQuizAttempts(): SaveQuizAttemptInput[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter(isSaveQuizAttemptInput) : [];
  } catch {
    return [];
  }
}

export function writePendingQuizAttempts(attempts: Iterable<SaveQuizAttemptInput>) {
  if (typeof window === 'undefined') return;

  try {
    const values = Array.from(attempts);
    if (values.length === 0) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  } catch {
    // The active quiz still retains its in-memory retry queue when storage is unavailable.
  }
}

export function clearPendingQuizAttempts() {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing else can be cleared when storage is unavailable.
  }
}

function isSaveQuizAttemptInput(value: unknown): value is SaveQuizAttemptInput {
  if (!value || typeof value !== 'object') return false;

  const attempt = value as Partial<SaveQuizAttemptInput>;
  return (
    Number.isInteger(attempt.vocabId) &&
    (attempt.vocabId ?? 0) > 0 &&
    (attempt.releaseId === undefined ||
      (Number.isInteger(attempt.releaseId) && (attempt.releaseId ?? 0) > 0)) &&
    ['learn', 'review', 'placement'].includes(attempt.mode ?? '') &&
    ['btf', 'ftb'].includes(attempt.direction ?? '') &&
    typeof attempt.isCorrect === 'boolean' &&
    typeof attempt.wasOverridden === 'boolean' &&
    isUuid(attempt.sessionId) &&
    typeof attempt.idempotencyKey === 'string' &&
    /^[a-zA-Z0-9_-]{16,128}$/.test(attempt.idempotencyKey)
  );
}
