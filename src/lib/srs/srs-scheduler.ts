import { DEFAULT_SRS_CONFIG } from './srs-config';

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function getIntervalMinutesForLevel(srsLevel: number) {
  const intervals = DEFAULT_SRS_CONFIG.intervalsMinutes;

  return intervals[Math.min(srsLevel, intervals.length - 1)];
}

export function getInitialSrsState(now = new Date()) {
  const srsLevel = DEFAULT_SRS_CONFIG.initialLevel;
  const intervalMinutes = getIntervalMinutesForLevel(srsLevel);

  return {
    srsLevel,
    intervalMinutes,
    dueAt: addMinutes(now, intervalMinutes),
  };
}

export function getNextSrsState(params: {
  currentSrsLevel: number;
  wasCorrect: boolean;
  now?: Date;
}) {
  const now = params.now ?? new Date();

  const nextSrsLevel = params.wasCorrect
    ? params.currentSrsLevel + DEFAULT_SRS_CONFIG.correctLevelIncrease
    : Math.max(0, params.currentSrsLevel - DEFAULT_SRS_CONFIG.lapseLevelDecrease);

  const intervalMinutes = getIntervalMinutesForLevel(nextSrsLevel);

  return {
    srsLevel: nextSrsLevel,
    intervalMinutes,
    dueAt: addMinutes(now, intervalMinutes),
  };
}
