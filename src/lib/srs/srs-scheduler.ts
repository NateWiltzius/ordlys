import { DEFAULT_SRS_CONFIG } from './srs-config';

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function getIntervalMinutesForLevel(srsLevel: number) {
  const intervals = DEFAULT_SRS_CONFIG.intervalsMinutes;

  return intervals[Math.min(srsLevel, intervals.length - 1)];
}

export function getSrsStateForLevel(srsLevel: number, now = new Date()) {
  const normalizedLevel = Math.min(
    DEFAULT_SRS_CONFIG.maxLevel,
    Math.max(DEFAULT_SRS_CONFIG.initialLevel, srsLevel),
  );
  const intervalMinutes = getIntervalMinutesForLevel(normalizedLevel);

  return {
    srsLevel: normalizedLevel,
    intervalMinutes,
    dueAt: addMinutes(now, intervalMinutes),
  };
}

export function getInitialSrsState(now = new Date()) {
  return getSrsStateForLevel(DEFAULT_SRS_CONFIG.initialLevel, now);
}

export function getNextSrsState(params: {
  currentSrsLevel: number;
  wasCorrect: boolean;
  now?: Date;
}) {
  const now = params.now ?? new Date();
  const currentSrsLevel = Math.min(
    DEFAULT_SRS_CONFIG.maxLevel,
    Math.max(DEFAULT_SRS_CONFIG.initialLevel, params.currentSrsLevel),
  );

  const nextSrsLevel = params.wasCorrect
    ? Math.min(
        DEFAULT_SRS_CONFIG.maxLevel,
        currentSrsLevel + DEFAULT_SRS_CONFIG.correctLevelIncrease,
      )
    : Math.max(
        DEFAULT_SRS_CONFIG.initialLevel,
        currentSrsLevel - DEFAULT_SRS_CONFIG.lapseLevelDecrease,
      );

  const intervalMinutes = getIntervalMinutesForLevel(nextSrsLevel);

  return {
    srsLevel: nextSrsLevel,
    intervalMinutes,
    dueAt: addMinutes(now, intervalMinutes),
  };
}
