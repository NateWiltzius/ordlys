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

export const SRS_CATEGORIES = [
  {
    key: 'learning',
    label: 'Learning',
    minimumLevel: 0,
    maximumLevel: 2,
    levelLabel: 'Levels 1–3',
  },
  { key: 'strong', label: 'Strong', minimumLevel: 3, maximumLevel: 5, levelLabel: 'Levels 4–6' },
  { key: 'mature', label: 'Mature', minimumLevel: 6, maximumLevel: 7, levelLabel: 'Levels 7–8' },
  { key: 'mastered', label: 'Mastered', minimumLevel: 8, maximumLevel: 8, levelLabel: 'Level 9' },
] as const;

export type SrsCategoryKey = (typeof SRS_CATEGORIES)[number]['key'];
export type SrsCategoryCounts = Record<SrsCategoryKey, number>;

export function normalizeSrsLevel(srsLevel: number): number {
  return Math.min(SRS_LEVEL_LABELS.length - 1, Math.max(0, Math.trunc(srsLevel)));
}

export function getSrsCategoryKey(srsLevel: number): SrsCategoryKey {
  const normalizedLevel = normalizeSrsLevel(srsLevel);
  return (
    SRS_CATEGORIES.find(
      category =>
        normalizedLevel >= category.minimumLevel && normalizedLevel <= category.maximumLevel,
    )?.key ?? 'learning'
  );
}

export const DEFAULT_SRS_CONFIG = {
  initialLevel: 0,
  maxLevel: SRS_LEVEL_LABELS.length - 1,
  lapseLevelDecrease: 1,
  correctLevelIncrease: 1,
  intervalsMinutes: DEFAULT_SRS_INTERVALS_MINUTES,
} as const;

export const LESSON_PROGRESSION_CONFIG = {
  // SRS levels are stored zero-based but shown to learners one-based.
  // Reaching Strong is the point at which a word counts as learned.
  learnedSrsLevel: 3,
  learnedDisplayLevel: 4,
  unlockRatio: 0.8,
} as const;

export const PLACEMENT_TEST_CONFIG = {
  passedSrsLevel: LESSON_PROGRESSION_CONFIG.learnedSrsLevel,
} as const;
