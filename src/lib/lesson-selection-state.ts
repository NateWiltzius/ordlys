export function parseSelectedLessonId(
  value: string | string[] | undefined,
  availableLessonIds: number[],
): number | null {
  if (availableLessonIds.length === 0) return null;

  const selectedLessonId = typeof value === 'string' ? parseId(value) : null;
  return selectedLessonId && availableLessonIds.includes(selectedLessonId)
    ? selectedLessonId
    : availableLessonIds[0];
}

function parseId(value: string): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}
