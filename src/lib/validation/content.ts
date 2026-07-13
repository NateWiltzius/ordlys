import { UserFacingError } from '../action-result';

export const CONTENT_LIMITS = {
  deckTitle: 255,
  deckDescription: 255,
  languageTag: 35,
  lessonTitle: 255,
  vocabText: 255,
  vocabTag: 64,
  vocabNotes: 2000,
  alternatives: 20,
  feedbackMessage: 2000,
  feedbackPagePath: 255,
  feedbackContactEmail: 320,
} as const;

export function requiredText(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== 'string' || !value.trim())
    throw new UserFacingError('VALIDATION_ERROR', `${label} is required.`);
  const text = value.trim();
  if (text.length > maxLength)
    throw new UserFacingError(
      'VALIDATION_ERROR',
      `${label} must be ${maxLength} characters or fewer.`,
    );
  return text;
}

export function optionalText(value: unknown, label: string, maxLength: number): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string')
    throw new UserFacingError('VALIDATION_ERROR', `${label} must be text.`);
  const text = value.trim();
  if (text.length > maxLength)
    throw new UserFacingError(
      'VALIDATION_ERROR',
      `${label} must be ${maxLength} characters or fewer.`,
    );
  return text || null;
}

export function optionalLanguageTag(value: unknown, label: string): string | null {
  const tag = optionalText(value, label, CONTENT_LIMITS.languageTag);
  if (!tag) return null;

  try {
    return Intl.getCanonicalLocales(tag)[0];
  } catch {
    throw new UserFacingError(
      'VALIDATION_ERROR',
      `${label} must be a valid language tag, such as en, nb, or pt-BR.`,
    );
  }
}

export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
