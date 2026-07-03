export const DEFAULT_SRS_INTERVALS_MINUTES = [
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

export const DEFAULT_SRS_CONFIG = {
  initialLevel: 0,
  lapseLevelDecrease: 1,
  correctLevelIncrease: 1,
  intervalsMinutes: DEFAULT_SRS_INTERVALS_MINUTES,
} as const;
