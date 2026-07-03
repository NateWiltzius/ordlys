export function normalizeAnswer(value: string) {
  return value.trim().normalize('NFKC').toLowerCase().replace(/\s+/g, ' ');
}
