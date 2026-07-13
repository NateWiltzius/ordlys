import type { LessonProgress } from '@/types/review.types';

export type DeckProgressSummary = {
  lessons: LessonProgress[];
  totalCards: number;
  introducedCards: number;
  coveredLessons: number;
  percentage: number;
  currentLesson: LessonProgress | null;
  currentLessonNumber: number;
  nextLesson: LessonProgress | null;
  allCardsIntroduced: boolean;
  masteryComplete: boolean;
};

export function summarizeDeckProgress(lessonProgress: LessonProgress[]): DeckProgressSummary {
  const lessons = lessonProgress.filter(lesson => lesson.totalWords > 0);
  const totalCards = lessons.reduce((total, lesson) => total + lesson.totalWords, 0);
  const introducedCards = lessons.reduce(
    (total, lesson) => total + Math.min(lesson.learnedWords, lesson.totalWords),
    0,
  );
  const coveredLessons = lessons.filter(lesson => lesson.learnedWords >= lesson.totalWords).length;
  const currentLesson =
    lessons.find(
      lesson =>
        lesson.isUnlocked &&
        (lesson.learnedWords < lesson.totalWords || lesson.masteredWords < lesson.requiredWords),
    ) ??
    lessons.findLast(lesson => lesson.isUnlocked) ??
    null;
  const currentLessonIndex = currentLesson
    ? lessons.findIndex(lesson => lesson.lessonId === currentLesson.lessonId)
    : -1;

  return {
    lessons,
    totalCards,
    introducedCards,
    coveredLessons,
    percentage: totalCards === 0 ? 0 : Math.round((introducedCards / totalCards) * 100),
    currentLesson,
    currentLessonNumber: currentLessonIndex + 1,
    nextLesson: lessons[currentLessonIndex + 1] ?? null,
    allCardsIntroduced: totalCards > 0 && introducedCards >= totalCards,
    masteryComplete:
      lessons.length > 0 && lessons.every(lesson => lesson.masteredWords >= lesson.requiredWords),
  };
}
