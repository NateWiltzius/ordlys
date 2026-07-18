import { describe, expect, it } from 'vitest';
import { getNextSrsState } from './srs-scheduler';

const NOW = new Date('2026-07-17T10:00:00.000Z');

describe('getNextSrsState', () => {
  it('advances a correct answer by one level', () => {
    const next = getNextSrsState({ currentSrsLevel: 5, wasCorrect: true, now: NOW });

    expect(next.srsLevel).toBe(6);
    expect(next.intervalMinutes).toBe(30 * 24 * 60);
  });

  it('decreases an incorrect answer by one level', () => {
    const next = getNextSrsState({ currentSrsLevel: 8, wasCorrect: false, now: NOW });

    expect(next.srsLevel).toBe(7);
    expect(next.intervalMinutes).toBe(90 * 24 * 60);
    expect(next.dueAt).toEqual(new Date('2026-10-15T10:00:00.000Z'));
  });

  it('keeps a missed learning word at the initial level', () => {
    expect(getNextSrsState({ currentSrsLevel: 0, wasCorrect: false, now: NOW }).srsLevel).toBe(0);
  });
});
