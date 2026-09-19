import type { LessonProgress } from '@/types/review.types';

export function getLessonUnlockMessage(lessons: LessonProgress[], lessonIndex: number) {
  const lesson = lessons[lessonIndex];
  if (!lesson || lesson.isUnlocked || lesson.totalWords === 0) return null;
  const previous = lessons.slice(0, lessonIndex).findLast(item => item.totalWords > 0);
  if (!previous) return null;
  if (!previous.isUnlocked)
    return `Unlock “${previous.lessonTitle}” first, then work through its cards.`;
  const toIntroduce = Math.max(0, previous.totalWords - previous.introducedWords);
  const toStrengthen = Math.max(0, previous.requiredWords - previous.learnedWords);
  return `In “${previous.lessonTitle}”, learn ${toIntroduce} more ${toIntroduce === 1 ? 'card' : 'cards'} or strengthen ${toStrengthen} more through review to unlock this lesson.`;
}

export function getDeckLearningEmptyState(lessons: LessonProgress[]) {
  const nonEmptyLessons = lessons.filter(lesson => lesson.totalWords > 0);
  if (nonEmptyLessons.length === 0) {
    return { label: 'No cards yet', description: 'This deck has no published cards to learn yet.' };
  }
  if (nonEmptyLessons.every(lesson => lesson.introducedWords >= lesson.totalWords)) {
    return {
      label: 'All cards started',
      description:
        'You’ve started every card in this deck. Review cards when they’re due to keep building your recall.',
    };
  }
  const lockedIndex = lessons.findIndex(
    lesson => !lesson.isUnlocked && lesson.totalWords > lesson.introducedWords,
  );
  if (lockedIndex >= 0) {
    return {
      label: 'Next lesson locked',
      description:
        getLessonUnlockMessage(lessons, lockedIndex) ?? 'Keep reviewing to unlock the next lesson.',
    };
  }
  return {
    label: 'No new cards available',
    description:
      'No new cards are available right now. Check the lessons below or return when your next review is due.',
  };
}
