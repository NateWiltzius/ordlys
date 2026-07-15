export const LEARN_SESSION_SIZES = [3, 5, 10, 20] as const;

export const DEFAULT_LEARN_SESSION_SIZE = 5;

export function parseSessionSize(
  value: string | string[] | undefined,
  allowedSizes: readonly number[],
  defaultSize: number,
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
