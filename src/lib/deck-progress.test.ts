import { describe, expect, it } from 'vitest';
import type { LessonProgress } from '@/types/review.types';
import { summarizeDeckProgress } from './deck-progress';

function lesson(
  lessonId: number,
  totalWords: number,
  introducedWords: number,
  learnedWords: number,
  requiredWords: number,
  isUnlocked = true,
): LessonProgress {
  return {
    lessonId,
    lessonTitle: `Lesson ${lessonId}`,
    totalWords,
    introducedWords,
    learnedWords,
    requiredWords,
    isUnlocked,
    canTakePlacementTest: false,
  };
}

describe('deck progress summary', () => {
  it('summarizes introduced cards and covered lessons', () => {
    const summary = summarizeDeckProgress([lesson(1, 10, 10, 8, 8), lesson(2, 10, 5, 2, 8)]);

    expect(summary).toMatchObject({
      totalCards: 20,
      introducedCards: 15,
      coveredLessons: 1,
      percentage: 75,
      currentLessonNumber: 2,
      allCardsIntroduced: false,
      lessonMilestonesComplete: false,
    });
    expect(summary.currentLesson?.lessonId).toBe(2);
  });

  it('ignores empty lessons and caps malformed introduced counts', () => {
    const summary = summarizeDeckProgress([lesson(1, 0, 0, 0, 0), lesson(2, 4, 10, 4, 4)]);

    expect(summary).toMatchObject({
      totalCards: 4,
      introducedCards: 4,
      coveredLessons: 1,
      percentage: 100,
      allCardsIntroduced: true,
      lessonMilestonesComplete: true,
    });
  });

  it('returns an empty summary when the deck has no cards', () => {
    expect(summarizeDeckProgress([])).toMatchObject({
      totalCards: 0,
      introducedCards: 0,
      percentage: 0,
      currentLesson: null,
      currentLessonNumber: 0,
      nextLesson: null,
      allCardsIntroduced: false,
      lessonMilestonesComplete: false,
    });
  });
});
