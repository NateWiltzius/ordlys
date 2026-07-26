'use client';

import QuizAnswerForm from '@/components/quiz/quiz-answer-form';
import QuizFeedbackPanel from '@/components/quiz/quiz-feedback-panel';
import QuizStats from '@/app/(protected)/decks/[deckId]/_components/quiz/quiz-stats';
import { normalizeAnswer } from '@/lib/quiz/normalize';
import {
  shuffleArray,
  buildQuizQueue,
  getQuizAttemptOutcome,
  buildRollingReviewQueue,
} from '@/lib/quiz/quiz-helpers';
import {
  QuizQueueItem,
  QuizProgressItem,
  QuizProgressStats,
  QuizSourceItem,
  SaveQuizAttemptInput,
  StudyMode,
} from '@/types/quiz.types';
import { Button, ProgressBar } from '@heroui/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StudyTone } from '@/lib/study-colors';
import { HomeIcon } from '@heroicons/react/24/outline';
import StatusAlert from '@/components/shared/status-alert';
import { getNextReviewBatchAction, saveQuizAttemptAction } from '@/server/review.actions';
import {
  readPendingQuizAttempts,
  writePendingQuizAttempts,
} from '@/lib/quiz/pending-quiz-attempts';
import QuizCompletionSummary from '@/components/quiz/quiz-completion-summary';
import type { NextReviewBatch } from '@/types/review.types';
import { getDifficultQuizItems, getSrsMilestoneCounts } from '@/lib/quiz/quiz-completion';
import { useQuizSession } from '@/hooks/use-quiz-session';

type Props = {
  quizItems: QuizSourceItem[];
  completionHref: string;
  tone?: StudyTone;
  allowAnswerOverride?: boolean;
  studyMode: StudyMode;
  recordAttempts?: boolean;
  onSessionStart?: () => void;
  reviewDeckId?: number;
  showExitButton?: boolean;
};

export default function QuizMode({
  quizItems,
  completionHref,
  tone = 'neutral',
  allowAnswerOverride = true,
  studyMode,
  recordAttempts = true,
  onSessionStart,
  reviewDeckId,
  showExitButton = true,
}: Props) {
  // A server action can reconcile this route with fresh due-card data (for example when an
  // auth cookie is refreshed). Keep the cards that started this session so that reconciliation
  // does not replace the active queue and reset the learner's in-memory progress.
  const [sessionQuizItems] = useState(() => quizItems);
  const [session, dispatchSession] = useQuizSession(sessionQuizItems);
  const {
    answer,
    failedCardIds,
    missCounts,
    srsTransitions,
    quizQueue,
    quizProgress,
    attemptStats,
    firstAttemptStats,
    feedback,
  } = session;
  const [nextReview, setNextReview] = useState<NextReviewBatch | null>(null);
  const [nextReviewLoading, setNextReviewLoading] = useState(false);
  const [pendingSaveCount, setPendingSaveCount] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const continueHandledRef = useRef(false);
  const attemptKeyRef = useRef<string | null>(null);
  const pendingSaveCountRef = useRef(0);
  const pendingAttemptsRef = useRef<Map<string, SaveQuizAttemptInput>>(new Map());
  const failedAttemptKeysRef = useRef<Set<string>>(new Set());
  const inFlightAttemptKeysRef = useRef<Set<string>>(new Set());
  const attemptedDirectionKeysRef = useRef<Set<string>>(new Set());
  const nextReviewFetchedRef = useRef(false);
  const sessionCardIdsRef = useRef(new Set(sessionQuizItems.map(item => item.id)));
  const pendingReviewItemsRef = useRef<QuizSourceItem[]>([]);
  const sessionIdRef = useRef<string | null>(null);
  const usesRollingReviewQueue = studyMode === 'review' && recordAttempts;

  const saveAttempt = useCallback(
    (attempt: SaveQuizAttemptInput) => {
      pendingAttemptsRef.current.set(attempt.idempotencyKey, attempt);
      writePendingQuizAttempts(pendingAttemptsRef.current.values());
      if (inFlightAttemptKeysRef.current.has(attempt.idempotencyKey)) return;

      inFlightAttemptKeysRef.current.add(attempt.idempotencyKey);
      pendingSaveCountRef.current += 1;
      setPendingSaveCount(count => count + 1);

      void saveQuizAttemptAction(attempt)
        .then(result => {
          const transition = result.transition;
          if (transition && sessionCardIdsRef.current.has(attempt.vocabId)) {
            dispatchSession({
              type: 'srs_transition_recorded',
              vocabId: attempt.vocabId,
              transition,
            });
          }
          pendingAttemptsRef.current.delete(attempt.idempotencyKey);
          failedAttemptKeysRef.current.delete(attempt.idempotencyKey);
          writePendingQuizAttempts(pendingAttemptsRef.current.values());
          if (failedAttemptKeysRef.current.size === 0) {
            setSaveError(null);
          }
          if (pendingAttemptsRef.current.size === 0) {
            setSaveNotice(null);
          }
        })
        .catch(() => {
          failedAttemptKeysRef.current.add(attempt.idempotencyKey);
          setSaveError(
            'Some answers have not been saved yet. They are stored in this tab and can be retried.',
          );
        })
        .finally(() => {
          inFlightAttemptKeysRef.current.delete(attempt.idempotencyKey);
          pendingSaveCountRef.current = Math.max(0, pendingSaveCountRef.current - 1);
          setPendingSaveCount(count => Math.max(0, count - 1));
        });
    },
    [dispatchSession],
  );

  const retryFailedSaves = useCallback(() => {
    const attempts = Array.from(pendingAttemptsRef.current.values());
    failedAttemptKeysRef.current.clear();
    setSaveError(null);
    setSaveNotice('Retrying saved answers…');

    for (const attempt of attempts) {
      saveAttempt(attempt);
    }
  }, [saveAttempt]);

  useEffect(() => {
    setHasMounted(true);
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
    dispatchSession({
      type: 'reset',
      quizItems: sessionQuizItems,
      queue,
    });
    setNextReview(null);
    setNextReviewLoading(false);
    pendingSaveCountRef.current = 0;
    pendingAttemptsRef.current.clear();
    failedAttemptKeysRef.current.clear();
    inFlightAttemptKeysRef.current.clear();
    attemptedDirectionKeysRef.current.clear();
    nextReviewFetchedRef.current = false;
    setPendingSaveCount(0);
    setSaveError(null);
    setSaveNotice(null);
    continueHandledRef.current = false;
    attemptKeyRef.current = null;

    const recoveredAttempts = readPendingQuizAttempts();
    if (recoveredAttempts.length > 0) {
      setSaveNotice(
        `Retrying ${recoveredAttempts.length} unsaved ${
          recoveredAttempts.length === 1 ? 'answer' : 'answers'
        } from this tab.`,
      );
      for (const attempt of recoveredAttempts) {
        saveAttempt(attempt);
      }
    }
  }, [dispatchSession, saveAttempt, sessionQuizItems, usesRollingReviewQueue]);

  const sessionIsSaved =
    quizQueue !== null && quizQueue.length === 0 && pendingSaveCount === 0 && !saveError;

  useEffect(() => {
    if (!recordAttempts || !sessionIsSaved || nextReviewFetchedRef.current) return;

    let ignore = false;
    nextReviewFetchedRef.current = true;
    setNextReviewLoading(true);

    void getNextReviewBatchAction(reviewDeckId)
      .then(result => {
        if (!ignore) setNextReview(result);
      })
      .catch(() => {
        if (!ignore) setNextReview(null);
      })
      .finally(() => {
        if (!ignore) setNextReviewLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [recordAttempts, reviewDeckId, sessionIsSaved]);

  useEffect(() => {
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (pendingAttemptsRef.current.size === 0) return;

      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, []);

  const exitQuiz = useCallback(() => {
    if (
      pendingAttemptsRef.current.size > 0 &&
      !window.confirm(
        'Some answers are still waiting to save. Leave now? Ordlys will retry them when you next open a quiz in this tab.',
      )
    ) {
      return;
    }
    window.location.assign('/dashboard');
  }, []);

  const currentQuizItem = quizQueue?.[0];
  const currentSourceItem = currentQuizItem
    ? sessionQuizItems.find(item => item.id === currentQuizItem.cardId)
    : undefined;
  const exitQuizButton = showExitButton ? (
    <Button
      variant="tertiary"
      size="sm"
      aria-label="Exit quiz and return to Today"
      className="fixed right-4 top-4 z-50 size-10 rounded-full border border-default-200 bg-background/95 p-0 shadow-md backdrop-blur"
      onPress={exitQuiz}
    >
      <HomeIcon className="size-5" aria-hidden="true" />
    </Button>
  ) : null;

  const progressStats: QuizProgressStats = useMemo(() => {
    const progressItems = Object.values(quizProgress);
    const totalCards = sessionQuizItems.length;
    const totalDirections = totalCards * 2;

    const passedDirections = progressItems.reduce((total, item) => {
      return total + Number(item.btfPassed) + Number(item.ftbPassed);
    }, 0);

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
        attemptStats.totalAttempts === 0
          ? 0
          : Math.round((attemptStats.correctAttempts / attemptStats.totalAttempts) * 100),
    };
  }, [sessionQuizItems.length, quizProgress, attemptStats]);

  const handleAnswerSubmit = () => {
    if (!currentQuizItem || answer.trim().length === 0) return;

    onSessionStart?.();
    continueHandledRef.current = false;
    attemptKeyRef.current = crypto.randomUUID();
    dispatchSession({
      type: 'feedback_shown',
      feedback: {
        quizItem: currentQuizItem,
        submittedAnswer: answer,
        isCorrect: currentQuizItem.acceptedAnswers.some(
          acceptedAnswer => normalizeAnswer(answer) === normalizeAnswer(acceptedAnswer),
        ),
      },
    });
  };

  const handleGiveUp = () => {
    if (!currentQuizItem) return;

    onSessionStart?.();
    continueHandledRef.current = false;
    attemptKeyRef.current = crypto.randomUUID();
    dispatchSession({
      type: 'feedback_shown',
      feedback: {
        quizItem: currentQuizItem,
        submittedAnswer: '',
        isCorrect: false,
      },
    });
  };

  const handleContinue = (acceptAnyway = false) => {
    if (!feedback || continueHandledRef.current) return;
    continueHandledRef.current = true;

    const { quizItem } = feedback;
    const { isAccepted, shouldMarkMissed } = getQuizAttemptOutcome({
      isCorrect: feedback.isCorrect,
      wasOverridden: acceptAnyway,
    });
    const currentProgress = quizProgress[quizItem.cardId];
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
    if (isFirstDirectionAttempt) {
      attemptedDirectionKeysRef.current.add(directionKey);
    }

    if (recordAttempts) {
      saveAttempt({
        vocabId: quizItem.cardId,
        mode: studyMode,
        direction: quizItem.direction,
        isCorrect: feedback.isCorrect,
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

  if (quizQueue === null) {
    return (
      <>
        {exitQuizButton}
        <div className="w-full" data-study-tone={tone}>
          <section className="border-y border-default-200 py-6">
            <h2 className="text-lg font-semibold">Preparing quiz</h2>
            <p className="mt-1 text-sm text-default-500">Building your study queue.</p>
            <div className="mt-4">
              {hasMounted ? (
                <ProgressBar isIndeterminate aria-label="Preparing quiz">
                  <ProgressBar.Track>
                    <ProgressBar.Fill />
                  </ProgressBar.Track>
                </ProgressBar>
              ) : (
                <div className="h-2 w-full animate-pulse rounded-full bg-default-200" />
              )}
            </div>
          </section>
        </div>
      </>
    );
  }

  if (!currentQuizItem) {
    if (pendingSaveCount === 0 && !saveError) {
      return (
        <div className="w-full" data-study-tone={tone}>
          <QuizCompletionSummary
            progressStats={progressStats}
            attemptStats={attemptStats}
            firstAttemptStats={firstAttemptStats}
            studyMode={studyMode}
            recordAttempts={recordAttempts}
            missedCardCount={Object.keys(missCounts).length}
            difficultItems={getDifficultQuizItems(sessionQuizItems, missCounts)}
            milestones={getSrsMilestoneCounts(Object.values(srsTransitions))}
            nextReview={nextReview}
            nextReviewLoading={
              nextReviewLoading ||
              (recordAttempts && sessionIsSaved && !nextReviewFetchedRef.current)
            }
            completionHref={completionHref}
            tone={tone}
          />
        </div>
      );
    }

    return (
      <>
        {exitQuizButton}
        <div className="w-full" data-study-tone={tone}>
          <section className="border-y border-default-200 py-6">
            <h2 className="text-lg font-semibold">
              {saveError ? 'Progress needs attention' : 'Saving progress'}
            </h2>
            <p className="mt-1 text-sm text-default-500">
              {saveError
                ? 'Your unsaved answers are stored in this tab so you can retry now or leave safely.'
                : 'Finishing your session.'}
            </p>
            <div className="mt-4 space-y-4">
              {saveError ? (
                <StatusAlert status="danger">{saveError}</StatusAlert>
              ) : (
                <ProgressBar isIndeterminate aria-label="Saving quiz progress">
                  <ProgressBar.Track>
                    <ProgressBar.Fill />
                  </ProgressBar.Track>
                </ProgressBar>
              )}
            </div>
            {saveError ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="primary" onPress={retryFailedSaves}>
                  Retry saving
                </Button>
                <Button variant="tertiary" onPress={exitQuiz}>
                  Leave for now
                </Button>
              </div>
            ) : null}
          </section>
        </div>
      </>
    );
  }

  const currentFeedbackProgress = feedback ? quizProgress[feedback.quizItem.cardId] : undefined;
  const completesCurrentWord = Boolean(
    feedback?.isCorrect &&
      currentFeedbackProgress &&
      (feedback.quizItem.direction === 'btf'
        ? currentFeedbackProgress.ftbPassed
        : currentFeedbackProgress.btfPassed),
  );
  const wordCompletion: 'clean' | 'recovered' | undefined =
    feedback && completesCurrentWord
      ? failedCardIds.has(feedback.quizItem.cardId)
        ? 'recovered'
        : 'clean'
      : undefined;

  return (
    <>
      {exitQuizButton}
      <div className="w-full space-y-4" data-study-tone={tone}>
        <QuizStats
          progressStats={progressStats}
          attemptStats={attemptStats}
          tone={tone}
          studyMode={studyMode}
        />

        {saveError ? (
          <StatusAlert status="danger" title="Progress not saved">
            <span>{saveError}</span>{' '}
            <Button size="sm" variant="secondary" onPress={retryFailedSaves}>
              Retry now
            </Button>
          </StatusAlert>
        ) : null}
        {!saveError && saveNotice ? <StatusAlert status="warning">{saveNotice}</StatusAlert> : null}

        {feedback ? (
          <QuizFeedbackPanel
            feedback={feedback}
            studyMode={studyMode}
            wordCompletion={wordCompletion}
            recordAttempts={recordAttempts}
            onContinue={() => handleContinue()}
            onAcceptAnyway={
              allowAnswerOverride && !feedback.isCorrect && feedback.submittedAnswer.trim()
                ? () => handleContinue(true)
                : undefined
            }
          />
        ) : (
          <QuizAnswerForm
            prompt={currentQuizItem.prompt}
            hint={currentQuizItem.hint}
            answer={answer}
            direction={currentQuizItem.direction}
            frontLanguage={currentSourceItem?.frontLanguage ?? null}
            backLanguage={currentSourceItem?.backLanguage ?? null}
            tone={tone}
            onAnswerChange={answer => dispatchSession({ type: 'answer_changed', answer })}
            onSubmit={handleAnswerSubmit}
            onGiveUp={handleGiveUp}
            deckTitle={currentQuizItem.deckTitle}
            lessonTitle={currentQuizItem.lessonTitle}
          />
        )}
      </div>
    </>
  );
}
