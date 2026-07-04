export const CONTENT_LIMITS = {
  deckTitle: 255,
  deckDescription: 255,
  lessonTitle: 255,
  vocabText: 255,
  alternatives: 20,
} as const;

export function requiredText(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} is required.`);
  const text = value.trim();
  if (text.length > maxLength)
    throw new Error(`${label} must be ${maxLength} characters or fewer.`);
  return text;
}

export function optionalText(value: unknown, label: string, maxLength: number): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') throw new Error(`${label} must be text.`);
  const text = value.trim();
  if (text.length > maxLength)
    throw new Error(`${label} must be ${maxLength} characters or fewer.`);
  return text || null;
}

export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
