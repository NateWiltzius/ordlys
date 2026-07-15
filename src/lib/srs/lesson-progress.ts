import { LESSON_PROGRESSION_CONFIG } from './srs-config';
import type { LessonProgress } from '../../types/review.types';

export type LessonProgressRow = {
  lessonId: number;
  lessonTitle: string;
  totalWords: number;
  learnedWords: number;
  masteredWords: number;
};

export function buildLessonProgress(rows: LessonProgressRow[]): LessonProgress[] {
  let previousNonEmptyLessonPassed = true;

  return rows.map(row => {
    const totalWords = Number(row.totalWords);
    const learnedWords = Number(row.learnedWords);
    const masteredWords = Number(row.masteredWords);
    const requiredWords = Math.ceil(totalWords * LESSON_PROGRESSION_CONFIG.unlockRatio);
    const isUnlocked = totalWords === 0 || previousNonEmptyLessonPassed;
    const canTakePlacementTest = totalWords > learnedWords && isUnlocked;

    if (totalWords > 0) {
      previousNonEmptyLessonPassed = isUnlocked && masteredWords >= requiredWords;
    }

    return {
      lessonId: row.lessonId,
      lessonTitle: row.lessonTitle,
      totalWords,
      learnedWords,
      masteredWords,
      requiredWords,
      isUnlocked,
      canTakePlacementTest,
    };
  });
}

export function getUnlockedLessonIdsWithNewVocab(progress: LessonProgress[]): number[] {
  return progress
    .filter(lesson => lesson.isUnlocked && lesson.learnedWords < lesson.totalWords)
    .map(lesson => lesson.lessonId);
}

export function getUnlockedNewVocabCount(progress: LessonProgress[]): number {
  return progress.reduce(
    (count, lesson) =>
      lesson.isUnlocked ? count + Math.max(0, lesson.totalWords - lesson.learnedWords) : count,
    0,
  );
}
