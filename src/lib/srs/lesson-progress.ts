import { LESSON_PROGRESSION_CONFIG } from './srs-config';
import type { LessonProgress } from '../../types/review.types';

export type LessonProgressRow = {
  lessonId: number;
  lessonTitle: string;
  totalWords: number;
  introducedWords: number;
  learnedWords: number;
};

export function buildLessonProgress(rows: LessonProgressRow[]): LessonProgress[] {
  let previousNonEmptyLessonPassed = true;

  return rows.map(row => {
    const totalWords = Number(row.totalWords);
    const introducedWords = Number(row.introducedWords);
    const learnedWords = Number(row.learnedWords);
    const requiredWords = Math.ceil(totalWords * LESSON_PROGRESSION_CONFIG.unlockRatio);
    const isUnlocked = totalWords === 0 || previousNonEmptyLessonPassed;
    const canTakePlacementTest = totalWords > introducedWords && isUnlocked;

    if (totalWords > 0) {
      previousNonEmptyLessonPassed = isUnlocked && learnedWords >= requiredWords;
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
