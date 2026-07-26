import {
  addFirstAttempt,
  addReviewWordToQueue,
  buildQuizProgress,
  insertLater,
} from '../lib/quiz/quiz-helpers';
import type {
  QuizAttemptStats,
  QuizFeedback,
  QuizFirstAttemptStats,
  QuizProgress,
  QuizProgressItem,
  QuizQueueItem,
  QuizSourceItem,
} from '../types/quiz.types';
import type { SrsTransition } from '../types/review.types';
import { useReducer } from 'react';

export type QuizSessionState = {
  answer: string;
  failedCardIds: Set<number>;
  missCounts: Record<number, number>;
  srsTransitions: Record<number, SrsTransition>;
  quizQueue: QuizQueueItem[] | null;
  quizProgress: QuizProgress;
  attemptStats: QuizAttemptStats;
  firstAttemptStats: QuizFirstAttemptStats;
  feedback: QuizFeedback | null;
};

type QuizSessionAction =
  | { type: 'reset'; quizItems: QuizSourceItem[]; queue: QuizQueueItem[] }
  | { type: 'answer_changed'; answer: string }
  | { type: 'feedback_shown'; feedback: QuizFeedback }
  | { type: 'srs_transition_recorded'; vocabId: number; transition: SrsTransition }
  | {
      type: 'attempt_completed';
      quizItem: QuizQueueItem;
      nextProgressForCard: QuizProgressItem;
      isAccepted: boolean;
      shouldMarkMissed: boolean;
      completesCard: boolean;
      isFirstDirectionAttempt: boolean;
      nextReviewItem?: QuizSourceItem;
    };

const emptyAttemptStats: QuizAttemptStats = {
  totalAttempts: 0,
  correctAttempts: 0,
  incorrectAttempts: 0,
};

const emptyFirstAttemptStats: QuizFirstAttemptStats = {
  totalDirections: 0,
  correctDirections: 0,
  accuracyPercentage: 0,
};

export function createQuizSessionState(quizItems: QuizSourceItem[]): QuizSessionState {
  return {
    answer: '',
    failedCardIds: new Set(),
    missCounts: {},
    srsTransitions: {},
    quizQueue: null,
    quizProgress: buildQuizProgress(quizItems),
    attemptStats: emptyAttemptStats,
    firstAttemptStats: emptyFirstAttemptStats,
    feedback: null,
  };
}

export function quizSessionReducer(
  state: QuizSessionState,
  action: QuizSessionAction,
): QuizSessionState {
  switch (action.type) {
    case 'reset':
      return {
        ...createQuizSessionState(action.quizItems),
        quizQueue: action.queue,
      };
    case 'answer_changed':
      return { ...state, answer: action.answer };
    case 'feedback_shown':
      return { ...state, feedback: action.feedback };
    case 'srs_transition_recorded':
      return {
        ...state,
        srsTransitions: {
          ...state.srsTransitions,
          [action.vocabId]: action.transition,
        },
      };
    case 'attempt_completed': {
      const {
        quizItem,
        isAccepted,
        shouldMarkMissed,
        completesCard,
        isFirstDirectionAttempt,
        nextProgressForCard,
        nextReviewItem,
      } = action;
      const failedCardIds = new Set(state.failedCardIds);
      let quizQueue: QuizQueueItem[] | null;
      let quizProgress = state.quizProgress;

      if (isAccepted) {
        const remainingQueue = state.quizQueue?.slice(1) ?? [];
        quizQueue = nextReviewItem
          ? addReviewWordToQueue(remainingQueue, nextReviewItem)
          : remainingQueue;
        quizProgress = {
          ...state.quizProgress,
          [quizItem.cardId]: nextProgressForCard,
        };
        if (completesCard) failedCardIds.delete(quizItem.cardId);
      } else {
        failedCardIds.add(quizItem.cardId);
        if (!state.quizQueue) {
          quizQueue = null;
        } else {
          const [, ...remainingItems] = state.quizQueue;
          quizQueue = insertLater(remainingItems, quizItem, 2);
        }
      }

      return {
        ...state,
        answer: '',
        feedback: null,
        failedCardIds,
        quizQueue,
        quizProgress,
        missCounts: shouldMarkMissed
          ? {
              ...state.missCounts,
              [quizItem.cardId]: (state.missCounts[quizItem.cardId] ?? 0) + 1,
            }
          : state.missCounts,
        attemptStats: {
          totalAttempts: state.attemptStats.totalAttempts + 1,
          correctAttempts: state.attemptStats.correctAttempts + Number(isAccepted),
          incorrectAttempts: state.attemptStats.incorrectAttempts + Number(!isAccepted),
        },
        firstAttemptStats: isFirstDirectionAttempt
          ? addFirstAttempt(state.firstAttemptStats, isAccepted)
          : state.firstAttemptStats,
      };
    }
  }
}

export function useQuizSession(quizItems: QuizSourceItem[]) {
  return useReducer(quizSessionReducer, quizItems, createQuizSessionState);
}
