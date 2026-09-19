import { describe, expect, it } from 'vitest';
import {
  buildLessonProgress,
  getUnlockedLessonIdsWithNewVocab,
  getUnlockedNewVocabCount,
  type LessonProgressRow,
} from './lesson-progress';

function lesson(
  lessonId: number,
  totalWords: number,
  introducedWords: number,
  learnedWords: number,
): LessonProgressRow {
  return { lessonId, lessonTitle: `Lesson ${lessonId}`, totalWords, introducedWords, learnedWords };
}

describe('buildLessonProgress', () => {
  it('unlocks the next lesson after 80% of the released cards reach the threshold', () => {
    const progress = buildLessonProgress([lesson(1, 10, 8, 8), lesson(2, 10, 0, 0)]);

    expect(progress[0]).toMatchObject({ requiredWords: 8, isUnlocked: true });
    expect(progress[1]).toMatchObject({ isUnlocked: true, canTakePlacementTest: true });
  });

  it('keeps the next lesson locked while the preceding lesson is unfinished and below Strong', () => {
    const progress = buildLessonProgress([lesson(1, 10, 9, 7), lesson(2, 10, 0, 0)]);

    expect(progress[1]).toMatchObject({ isUnlocked: false, canTakePlacementTest: false });
  });

  it('offers a choice instead of automatically advancing after every word is introduced', () => {
    const progress = buildLessonProgress([lesson(1, 10, 10, 0), lesson(2, 10, 0, 0)]);

    expect(progress[1]).toMatchObject({
      isUnlocked: false,
      canTakePlacementTest: false,
      canContinueEarly: true,
    });
  });

  it('requires Strong in structured mode even when all words are introduced', () => {
    const progress = buildLessonProgress([lesson(1, 10, 10, 0), lesson(2, 10, 0, 0)], {
      strictProgression: true,
    });
    expect(progress[1]).toMatchObject({ isUnlocked: false, canContinueEarly: false });
  });

  it('keeps an explicit choice available after switching to structured mode', () => {
    const progress = buildLessonProgress(
      [lesson(1, 10, 0, 0), lesson(2, 10, 0, 0), lesson(3, 10, 0, 0)],
      { strictProgression: true, unlockedLessonIds: [2] },
    );
    expect(progress.map(item => item.isUnlocked)).toEqual([true, true, false]);
    expect(progress[1].canTakePlacementTest).toBe(true);
  });

  it('only offers the next nonempty lesson, without skipping multiple locked lessons', () => {
    const progress = buildLessonProgress([
      lesson(1, 10, 0, 0),
      lesson(2, 0, 0, 0),
      lesson(3, 10, 0, 0),
      lesson(4, 10, 0, 0),
    ]);
    expect(progress.map(item => item.canContinueEarly)).toEqual([false, false, true, false]);
  });

  it('rounds the Strong milestone upward', () => {
    const below = buildLessonProgress([lesson(1, 12, 12, 9), lesson(2, 10, 0, 0)]);
    const reached = buildLessonProgress([lesson(1, 12, 12, 10), lesson(2, 10, 0, 0)]);
    expect(below[0].requiredWords).toBe(10);
    expect(below[1].isUnlocked).toBe(false);
    expect(reached[1].isUnlocked).toBe(true);
  });

  it('does not relock a lesson that the learner has already started', () => {
    const progress = buildLessonProgress([
      lesson(1, 10, 9, 7),
      lesson(2, 10, 1, 0),
      lesson(3, 10, 0, 0),
    ]);

    expect(progress.map(item => item.isUnlocked)).toEqual([true, true, false]);
  });

  it('does not let an empty lesson interrupt progression', () => {
    const progress = buildLessonProgress([
      lesson(1, 10, 10, 8),
      lesson(2, 0, 0, 0),
      lesson(3, 10, 0, 0),
    ]);

    expect(progress.map(item => item.isUnlocked)).toEqual([true, true, true]);
  });

  it('makes unseen words from every unlocked lesson available', () => {
    const progress = buildLessonProgress([
      lesson(1, 10, 8, 8),
      lesson(2, 10, 0, 0),
      lesson(3, 10, 0, 0),
    ]);

    expect(getUnlockedLessonIdsWithNewVocab(progress)).toEqual([1, 2]);
    expect(getUnlockedNewVocabCount(progress)).toBe(12);
  });
});
