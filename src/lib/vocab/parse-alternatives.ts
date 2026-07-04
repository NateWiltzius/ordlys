export function parseAlternatives(value: FormDataEntryValue | null): string[] {
  if (typeof value !== 'string') return [];

  return value
    .split(/\r?\n/)
    .map(alternative => alternative.trim())
    .filter(Boolean);
}
