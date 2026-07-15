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
  learnedWords: number,
  masteredWords: number,
): LessonProgressRow {
  return { lessonId, lessonTitle: `Lesson ${lessonId}`, totalWords, learnedWords, masteredWords };
}

describe('buildLessonProgress', () => {
  it('unlocks the next lesson after 80% of the released cards reach the threshold', () => {
    const progress = buildLessonProgress([lesson(1, 10, 10, 8), lesson(2, 10, 0, 0)]);

    expect(progress[0]).toMatchObject({ requiredWords: 8, isUnlocked: true });
    expect(progress[1]).toMatchObject({ isUnlocked: true, canTakePlacementTest: true });
  });

  it('keeps the next lesson locked when the preceding released-card total is not mastered', () => {
    const progress = buildLessonProgress([lesson(1, 10, 10, 7), lesson(2, 10, 0, 0)]);

    expect(progress[1]).toMatchObject({ isUnlocked: false, canTakePlacementTest: false });
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
