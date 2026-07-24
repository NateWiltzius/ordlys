export const LEARN_SESSION_SIZES = [3, 5, 10, 20] as const;

export const DEFAULT_LEARN_SESSION_SIZE = 5;
export const LEARN_SESSION_SIZE_COOKIE = 'ordlys_learn_session_size';

export const REVIEW_SESSION_SIZES = [5, 10, 20] as const;

export const DEFAULT_REVIEW_SESSION_SIZE = 'all' as const;
export const QUICK_REVIEW_SESSION_SIZE = 5;
export const REVIEW_SESSION_SIZE_COOKIE = 'ordlys_review_session_size';

export function parseSessionSize(
  value: string | string[] | undefined,
  allowedSizes: readonly number[],
  defaultSize: number | 'all',
  allowAll = false,
): number | 'all' {
  const normalizedValue = Array.isArray(value) ? value[0] : value;
  if (allowAll && normalizedValue === 'all') return 'all';

  const parsed = Number(normalizedValue);
  return allowedSizes.includes(parsed) ? parsed : defaultSize;
}

export function getSessionSizeChoices(sizes: readonly number[], totalCount: number): number[] {
  return [...new Set(sizes)].filter(size => size > 0 && size < totalCount);
}

export function parseLearnSessionSize(
  requestedValue: string | string[] | undefined,
  preferredValue?: string,
): number | 'all' {
  const preferredSize = parseSessionSize(
    preferredValue,
    LEARN_SESSION_SIZES,
    DEFAULT_LEARN_SESSION_SIZE,
    true,
  );

  return parseSessionSize(requestedValue, LEARN_SESSION_SIZES, preferredSize, true);
}

export function parseReviewSessionSize(
  requestedValue: string | string[] | undefined,
  preferredValue?: string,
): number | 'all' {
  const preferredSize = parseSessionSize(
    preferredValue,
    REVIEW_SESSION_SIZES,
    DEFAULT_REVIEW_SESSION_SIZE,
    true,
  );

  return parseSessionSize(requestedValue, REVIEW_SESSION_SIZES, preferredSize, true);
}

export function getEstimatedReviewMinutes(cardCount: number): number {
  const normalizedCount = Math.max(0, Math.trunc(cardCount));
  if (normalizedCount === 0) return 0;
  return Math.max(1, Math.ceil((normalizedCount * 18) / 60));
}

export function getEstimatedReviewDuration(cardCount: number): string {
  const minutes = getEstimatedReviewMinutes(cardCount);
  return `about ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
}

export const getEstimatedStudyDuration = getEstimatedReviewDuration;
