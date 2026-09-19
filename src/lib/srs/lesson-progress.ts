import { LESSON_PROGRESSION_CONFIG } from './srs-config';
import type { LessonProgress } from '../../types/review.types';

export type LessonProgressRow = {
  lessonId: number;
  lessonTitle: string;
  totalWords: number;
  introducedWords: number;
  learnedWords: number;
};

export function buildLessonProgress(
  rows: LessonProgressRow[],
  options: { strictProgression?: boolean; unlockedLessonIds?: number[] } = {},
): LessonProgress[] {
  let previousNonEmptyLessonAllowsProgression = true;
  let previousNonEmptyLessonIsUnlocked = false;
  const explicitUnlocks = new Set(options.unlockedLessonIds ?? []);

  return rows.map(row => {
    const totalWords = Number(row.totalWords);
    const introducedWords = Number(row.introducedWords);
    const learnedWords = Number(row.learnedWords);
    const requiredWords = Math.ceil(totalWords * LESSON_PROGRESSION_CONFIG.unlockRatio);
    // Started lessons and explicit choices survive lapses and preference changes.
    const isUnlocked =
      totalWords === 0 ||
      introducedWords > 0 ||
      explicitUnlocks.has(row.lessonId) ||
      previousNonEmptyLessonAllowsProgression;
    const canContinueEarly =
      !options.strictProgression && !isUnlocked && previousNonEmptyLessonIsUnlocked;
    const canTakePlacementTest = totalWords > introducedWords && isUnlocked;

    if (totalWords > 0) {
      previousNonEmptyLessonAllowsProgression = isUnlocked && learnedWords >= requiredWords;
      previousNonEmptyLessonIsUnlocked = isUnlocked;
    }

    return {
      lessonId: row.lessonId,
      lessonTitle: row.lessonTitle,
      totalWords,
      introducedWords,
      learnedWords,
      requiredWords,
      isUnlocked,
      canTakePlacementTest,
      canContinueEarly,
    };
  });
}

export function getUnlockedLessonIdsWithNewVocab(progress: LessonProgress[]): number[] {
  return progress
    .filter(lesson => lesson.isUnlocked && lesson.introducedWords < lesson.totalWords)
    .map(lesson => lesson.lessonId);
}

export function getUnlockedNewVocabCount(progress: LessonProgress[]): number {
  return progress.reduce(
    (count, lesson) =>
      lesson.isUnlocked ? count + Math.max(0, lesson.totalWords - lesson.introducedWords) : count,
    0,
  );
}
