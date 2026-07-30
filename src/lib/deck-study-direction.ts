export const DECK_STUDY_DIRECTIONS = ['both', 'ftb', 'btf'] as const;

export type DeckStudyDirection = (typeof DECK_STUDY_DIRECTIONS)[number];

export const DECK_STUDY_DIRECTION_OPTIONS: ReadonlyArray<{
  value: DeckStudyDirection;
  label: string;
  description: string;
}> = [
  {
    value: 'ftb',
    label: 'Front → Back only',
    description: 'Show the question or image on the front, then answer with the back.',
  },
  {
    value: 'btf',
    label: 'Back → Front only',
    description: 'Show the back, then answer with the front.',
  },
  {
    value: 'both',
    label: 'Both directions',
    description: 'Test every card from front to back and back to front.',
  },
];

export function parseDeckStudyDirection(value: unknown): DeckStudyDirection {
  if (typeof value !== 'string' || !DECK_STUDY_DIRECTIONS.includes(value as DeckStudyDirection)) {
    throw new Error('Invalid card testing direction.');
  }

  return value as DeckStudyDirection;
}

export function formatDeckStudyDirection(value: DeckStudyDirection): string {
  return (
    DECK_STUDY_DIRECTION_OPTIONS.find(option => option.value === value)?.label ?? 'Both directions'
  );
}
