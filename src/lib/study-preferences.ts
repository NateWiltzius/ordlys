export type StudyPreferences = {
  strictProgression: boolean;
  dailyNewWordTarget: number;
  timeZone: string;
};

export const DEFAULT_STUDY_PREFERENCES: StudyPreferences = {
  strictProgression: false,
  dailyNewWordTarget: 10,
  timeZone: 'UTC',
};

export function validateStudyPreferences(input: StudyPreferences): StudyPreferences {
  if (
    typeof input?.strictProgression !== 'boolean' ||
    !Number.isInteger(input.dailyNewWordTarget) ||
    input.dailyNewWordTarget < 1 ||
    input.dailyNewWordTarget > 100 ||
    typeof input.timeZone !== 'string' ||
    input.timeZone.length > 100
  ) {
    throw new Error('Choose a daily target between 1 and 100 cards.');
  }
  try {
    new Intl.DateTimeFormat('en', { timeZone: input.timeZone }).format();
  } catch {
    throw new Error('Choose a valid time zone.');
  }
  return {
    strictProgression: input.strictProgression,
    dailyNewWordTarget: input.dailyNewWordTarget,
    timeZone: input.timeZone,
  };
}
