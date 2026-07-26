'use client';

import { useMountedTimestamp } from '@/hooks/use-mounted-timestamp';
import { useQuizSession } from '@/hooks/use-quiz-session';
import { getNextReviewBatch } from '@/lib/client/review-api';
import { getQuizAttemptOutcome } from '@/lib/quiz/quiz-helpers';
import { buildQuizQueue, buildRollingReviewQueue, shuffleArray } from '@/lib/quiz/quiz-helpers';
import { normalizeAnswer } from '@/lib/quiz/normalize';
import type {
  QuizProgressItem,
  QuizProgressStats,
  QuizQueueItem,
  QuizSourceItem,
  StudyMode,
} from '@/types/quiz.types';
import type { NextReviewBatch } from '@/types/review.types';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuizAttemptPersistence } from './use-quiz-attempt-persistence';

type Params = {
  quizItems: QuizSourceItem[];
  studyMode: StudyMode;
  recordAttempts: boolean;
  onSessionStart?: () => void;
  reviewDeckId?: number;
};

export function useQuizModeController({
  quizItems,
  studyMode,
  recordAttempts,
  onSessionStart,
  reviewDeckId,
}: Params) {
  const [sessionQuizItems] = useState(() => quizItems);
  const [session, dispatchSession] = useQuizSession(sessionQuizItems);
  const [nextReview, setNextReview] = useState<NextReviewBatch | null>(null);
  const [nextReviewLoading, setNextReviewLoading] = useState(false);
  const continueHandledRef = useRef(false);
  const attemptKeyRef = useRef<string | null>(null);
  const attemptedDirectionKeysRef = useRef<Set<string>>(new Set());
  const nextReviewFetchedRef = useRef(false);
  const sessionCardIdsRef = useRef(new Set(sessionQuizItems.map(item => item.id)));
  const pendingReviewItemsRef = useRef<QuizSourceItem[]>([]);
  const sessionIdRef = useRef<string | null>(null);
  const mountedAt = useMountedTimestamp();
  const usesRollingReviewQueue = studyMode === 'review' && recordAttempts;
  const persistence = useQuizAttemptPersistence(sessionCardIdsRef.current, dispatchSession);

  useEffect(() => {
    sessionIdRef.current = crypto.randomUUID();
    let queue: QuizQueueItem[];
    if (usesRollingReviewQueue) {
      const rollingQueue = buildRollingReviewQueue(sessionQuizItems);
      pendingReviewItemsRef.current = rollingQueue.pendingItems;
      queue = rollingQueue.queue;
    } else {
      pendingReviewItemsRef.current = [];
      queue = shuffleArray(buildQuizQueue(sessionQuizItems));
    }
    dispatchSession({ type: 'reset', quizItems: sessionQuizItems, queue });
    setNextReview(null);
    setNextReviewLoading(false);
    attemptedDirectionKeysRef.current.clear();
    nextReviewFetchedRef.current = false;
    continueHandledRef.current = false;
    attemptKeyRef.current = null;
  }, [dispatchSession, sessionQuizItems, usesRollingReviewQueue]);

  const sessionIsSaved =
    session.quizQueue !== null &&
    session.quizQueue.length === 0 &&
    persistence.pendingSaveCount === 0 &&
    !persistence.saveError;

  useEffect(() => {
    if (!recordAttempts || !sessionIsSaved || nextReviewFetchedRef.current) return;

    const controller = new AbortController();
    nextReviewFetchedRef.current = true;
    setNextReviewLoading(true);

    void getNextReviewBatch(reviewDeckId, controller.signal)
      .then(setNextReview)
      .catch(error => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) setNextReview(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setNextReviewLoading(false);
      });

    return () => controller.abort();
  }, [recordAttempts, reviewDeckId, sessionIsSaved]);

  const progressStats: QuizProgressStats = useMemo(() => {
    const progressItems = Object.values(session.quizProgress);
    const totalCards = sessionQuizItems.length;
    const totalDirections = totalCards * 2;
    const passedDirections = progressItems.reduce(
      (total, item) => total + Number(item.btfPassed) + Number(item.ftbPassed),
      0,
    );
    const completedCards = progressItems.filter(item => item.btfPassed && item.ftbPassed).length;

    return {
      totalCards,
      completedCards,
      remainingCards: totalCards - completedCards,
      passedDirections,
      totalDirections,
      progressPercentage:
        totalDirections === 0 ? 0 : Math.round((passedDirections / totalDirections) * 100),
      accuracyPercentage:
        session.attemptStats.totalAttempts === 0
          ? 0
          : Math.round(
              (session.attemptStats.correctAttempts / session.attemptStats.totalAttempts) * 100,
            ),
    };
  }, [session.attemptStats, session.quizProgress, sessionQuizItems.length]);

  const currentQuizItem = session.quizQueue?.[0];
  const currentSourceItem = currentQuizItem
    ? sessionQuizItems.find(item => item.id === currentQuizItem.cardId)
    : undefined;

  const showFeedback = (submittedAnswer: string, isCorrect: boolean) => {
    if (!currentQuizItem) return;
    onSessionStart?.();
    continueHandledRef.current = false;
    attemptKeyRef.current = crypto.randomUUID();
    dispatchSession({
      type: 'feedback_shown',
      feedback: { quizItem: currentQuizItem, submittedAnswer, isCorrect },
    });
  };

  const submitAnswer = () => {
    if (!currentQuizItem || session.answer.trim().length === 0) return;
    showFeedback(
      session.answer,
      currentQuizItem.acceptedAnswers.some(
        acceptedAnswer => normalizeAnswer(session.answer) === normalizeAnswer(acceptedAnswer),
      ),
    );
  };

  const giveUp = () => showFeedback('', false);

  const continueQuiz = (acceptAnyway = false) => {
    if (!session.feedback || continueHandledRef.current) return;
    continueHandledRef.current = true;

    const { quizItem } = session.feedback;
    const { isAccepted, shouldMarkMissed } = getQuizAttemptOutcome({
      isCorrect: session.feedback.isCorrect,
      wasOverridden: acceptAnyway,
    });
    const currentProgress = session.quizProgress[quizItem.cardId];
    const nextProgressForCard: QuizProgressItem = {
      ...currentProgress,
      btfPassed: isAccepted && quizItem.direction === 'btf' ? true : currentProgress.btfPassed,
      ftbPassed: isAccepted && quizItem.direction === 'ftb' ? true : currentProgress.ftbPassed,
    };
    const wasAlreadyFullyPassed = currentProgress.btfPassed && currentProgress.ftbPassed;
    const isNowFullyPassed = nextProgressForCard.btfPassed && nextProgressForCard.ftbPassed;
    const completesCard = isAccepted && isNowFullyPassed && !wasAlreadyFullyPassed;
    const directionKey = `${quizItem.cardId}:${quizItem.direction}`;
    const isFirstDirectionAttempt = !attemptedDirectionKeysRef.current.has(directionKey);
    if (isFirstDirectionAttempt) attemptedDirectionKeysRef.current.add(directionKey);

    if (recordAttempts) {
      persistence.saveAttempt({
        vocabId: quizItem.cardId,
        mode: studyMode,
        direction: quizItem.direction,
        isCorrect: session.feedback.isCorrect,
        wasOverridden: acceptAnyway,
        sessionId: sessionIdRef.current ?? (sessionIdRef.current = crypto.randomUUID()),
        idempotencyKey: attemptKeyRef.current ?? crypto.randomUUID(),
      });
    }
    attemptKeyRef.current = null;

    const nextReviewItem =
      isAccepted && completesCard && usesRollingReviewQueue
        ? pendingReviewItemsRef.current.shift()
        : undefined;
    dispatchSession({
      type: 'attempt_completed',
      quizItem,
      nextProgressForCard,
      isAccepted,
      shouldMarkMissed,
      completesCard,
      isFirstDirectionAttempt,
      nextReviewItem,
    });
  };

  return {
    ...persistence,
    answer: session.answer,
    attemptStats: session.attemptStats,
    changeAnswer: (answer: string) => dispatchSession({ type: 'answer_changed', answer }),
    continueQuiz,
    currentQuizItem,
    currentSourceItem,
    failedCardIds: session.failedCardIds,
    feedback: session.feedback,
    firstAttemptStats: session.firstAttemptStats,
    giveUp,
    hasMounted: mountedAt !== null,
    missCounts: session.missCounts,
    nextReview,
    nextReviewLoading:
      nextReviewLoading || (recordAttempts && sessionIsSaved && !nextReviewFetchedRef.current),
    progressStats,
    quizProgress: session.quizProgress,
    quizQueue: session.quizQueue,
    sessionQuizItems,
    srsTransitions: session.srsTransitions,
    submitAnswer,
  };
}
