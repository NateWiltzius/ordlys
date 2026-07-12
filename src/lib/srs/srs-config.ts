const DEFAULT_SRS_INTERVALS_MINUTES = [
  4 * 60, // 4 hours
  8 * 60, // 8 hours
  24 * 60, // 1 day
  2 * 24 * 60, // 2 days
  7 * 24 * 60, // 1 week
  14 * 24 * 60, // 2 weeks
  30 * 24 * 60, // 1 month
  90 * 24 * 60, // 3 months
  180 * 24 * 60, // 6 months
] as const;

export const SRS_LEVEL_LABELS = [
  'Learning',
  'Learning',
  'Learning',
  'Strong',
  'Strong',
  'Strong',
  'Mature',
  'Mature',
  'Mastered',
] as const;

export const DEFAULT_SRS_CONFIG = {
  initialLevel: 0,
  maxLevel: SRS_LEVEL_LABELS.length - 1,
  lapseLevelDecrease: 1,
  correctLevelIncrease: 1,
  intervalsMinutes: DEFAULT_SRS_INTERVALS_MINUTES,
} as const;

export const LESSON_PROGRESSION_CONFIG = {
  // SRS levels are stored zero-based but shown to learners one-based.
  unlockSrsLevel: 2,
  unlockDisplayLevel: 3,
  unlockRatio: 0.8,
} as const;

export const PLACEMENT_TEST_CONFIG = {
  passedSrsLevel: 3,
} as const;
