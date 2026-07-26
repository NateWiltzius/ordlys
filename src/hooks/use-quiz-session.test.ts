import { describe, expect, it } from 'vitest';
import { buildQuizQueue } from '../lib/quiz/quiz-helpers';
import type { QuizSourceItem } from '../types/quiz.types';
import { createQuizSessionState, quizSessionReducer } from './use-quiz-session';

const item: QuizSourceItem = {
  id: 1,
  front: 'hei',
  back: 'hello',
  frontAlternatives: [],
  backAlternatives: [],
  frontToBackQuizHint: null,
  backToFrontQuizHint: null,
  reading: null,
  frontLanguage: 'nb',
  backLanguage: 'en',
};

describe('quizSessionReducer', () => {
  it('resets all session-owned state around a prepared queue', () => {
    const queue = buildQuizQueue([item]);
    const state = quizSessionReducer(createQuizSessionState([item]), {
      type: 'reset',
      quizItems: [item],
      queue,
    });

    expect(state.quizQueue).toEqual(queue);
    expect(state.quizProgress[1]).toEqual({ cardId: 1, btfPassed: false, ftbPassed: false });
    expect(state.attemptStats.totalAttempts).toBe(0);
  });

  it('records an accepted direction and removes it from the queue', () => {
    const [quizItem] = buildQuizQueue([item]);
    const initial = {
      ...createQuizSessionState([item]),
      quizQueue: [quizItem],
    };
    const state = quizSessionReducer(initial, {
      type: 'attempt_completed',
      quizItem,
      nextProgressForCard: { cardId: 1, btfPassed: true, ftbPassed: false },
      isAccepted: true,
      shouldMarkMissed: false,
      completesCard: false,
      isFirstDirectionAttempt: true,
    });

    expect(state.quizQueue).toEqual([]);
    expect(state.quizProgress[1].btfPassed).toBe(true);
    expect(state.attemptStats).toMatchObject({ totalAttempts: 1, correctAttempts: 1 });
    expect(state.firstAttemptStats.totalDirections).toBe(1);
  });

  it('requeues a missed direction and tracks difficulty', () => {
    const [quizItem] = buildQuizQueue([item]);
    const initial = {
      ...createQuizSessionState([item]),
      quizQueue: [quizItem],
    };
    const state = quizSessionReducer(initial, {
      type: 'attempt_completed',
      quizItem,
      nextProgressForCard: initial.quizProgress[1],
      isAccepted: false,
      shouldMarkMissed: true,
      completesCard: false,
      isFirstDirectionAttempt: true,
    });

    expect(state.quizQueue).toHaveLength(1);
    expect(state.failedCardIds.has(1)).toBe(true);
    expect(state.missCounts[1]).toBe(1);
    expect(state.attemptStats.incorrectAttempts).toBe(1);
  });
});
