export function parsePositiveInteger(value: string | number): number | null {
  const parsedValue = typeof value === 'number' ? value : Number(value);

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}
