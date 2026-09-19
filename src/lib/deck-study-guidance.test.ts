import { describe, expect, it } from 'vitest';
import { buildLessonProgress, type LessonProgressRow } from './srs/lesson-progress';
import { getDeckLearningEmptyState, getLessonUnlockMessage } from './deck-study-guidance';

function lesson(
  id: number,
  totalWords: number,
  introducedWords = 0,
  learnedWords = 0,
): LessonProgressRow {
  return { lessonId: id, lessonTitle: `Lesson ${id}`, totalWords, introducedWords, learnedWords };
}

describe('deck study guidance', () => {
  it('does not describe an empty deck as completed', () => {
    expect(getDeckLearningEmptyState([]).label).toBe('No cards yet');
    expect(getDeckLearningEmptyState(buildLessonProgress([lesson(1, 0)])).label).toBe(
      'No cards yet',
    );
  });

  it('recognizes that every card has been started even when recall milestones are incomplete', () => {
    const progress = buildLessonProgress([lesson(1, 10, 10, 0), lesson(2, 0)]);
    expect(getDeckLearningEmptyState(progress).label).toBe('All cards started');
  });

  it('skips empty lessons when explaining the unlock requirement', () => {
    const progress = buildLessonProgress([lesson(1, 10, 9, 7), lesson(2, 0), lesson(3, 10)]);
    expect(getLessonUnlockMessage(progress, 2)).toBe(
      'In “Lesson 1”, learn 1 more card or strengthen 1 more through review to unlock this lesson.',
    );
    expect(getDeckLearningEmptyState(progress).label).toBe('Next lesson locked');
  });

  it('directs learners to unlock the preceding lesson before working on it', () => {
    const progress = buildLessonProgress([lesson(1, 10), lesson(2, 10), lesson(3, 10)]);
    expect(getLessonUnlockMessage(progress, 2)).toBe(
      'Unlock “Lesson 2” first, then work through its cards.',
    );
  });

  it('does not show a lock requirement for empty or already started lessons after a lapse', () => {
    const progress = buildLessonProgress([lesson(1, 10, 9, 0), lesson(2, 0), lesson(3, 10, 1)]);
    expect(getLessonUnlockMessage(progress, 1)).toBeNull();
    expect(getLessonUnlockMessage(progress, 2)).toBeNull();
  });

  it('does not claim completion if new cards remain in an unlocked lesson', () => {
    expect(getDeckLearningEmptyState(buildLessonProgress([lesson(1, 10, 2)])).label).toBe(
      'No new cards available',
    );
  });
});
