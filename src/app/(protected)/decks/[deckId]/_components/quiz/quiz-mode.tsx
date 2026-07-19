'use client';

import QuizAnswerForm from '@/components/quiz/quiz-answer-form';
import QuizFeedbackPanel from '@/components/quiz/quiz-feedback-panel';
import QuizStats from '@/app/(protected)/decks/[deckId]/_components/quiz/quiz-stats';
import { normalizeAnswer } from '@/lib/quiz/normalize';
import {
  shuffleArray,
  buildQuizQueue,
  buildQuizProgress,
  insertLater,
} from '@/lib/quiz/quiz-helpers';
import {
  QuizQueueItem,
  QuizProgress,
  QuizProgressItem,
  QuizFeedback,
  QuizAttemptStats,
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
import { saveQuizAttemptAction } from '@/server/review.actions';
import {
  readPendingQuizAttempts,
  writePendingQuizAttempts,
} from '@/lib/quiz/pending-quiz-attempts';
import QuizCompletionSummary from '@/components/quiz/quiz-completion-summary';

type Props = {
  quizItems: QuizSourceItem[];
  completionHref: string;
  tone?: StudyTone;
  allowAnswerOverride?: boolean;
  studyMode: StudyMode;
  recordAttempts?: boolean;
  onSessionStart?: () => void;
};

export default function QuizMode({
  quizItems,
  completionHref,
  tone = 'neutral',
  allowAnswerOverride = true,
  studyMode,
  recordAttempts = true,
  onSessionStart,
}: Props) {
  // A server action can reconcile this route with fresh due-card data (for example when an
  // auth cookie is refreshed). Keep the cards that started this session so that reconciliation
  // does not replace the active queue and reset the learner's in-memory progress.
  const [sessionQuizItems] = useState(() => quizItems);
  const [answer, setAnswer] = useState('');
  const [failedCardIds, setFailedCardIds] = useState<Set<number>>(() => new Set());
  const [missedCardIds, setMissedCardIds] = useState<Set<number>>(() => new Set());
  const [quizQueue, setQuizQueue] = useState<QuizQueueItem[] | null>(null);
  const [quizProgress, setQuizProgress] = useState<QuizProgress>(() =>
    buildQuizProgress(sessionQuizItems),
  );
  const [attemptStats, setAttemptStats] = useState<QuizAttemptStats>({
    totalAttempts: 0,
    correctAttempts: 0,
    incorrectAttempts: 0,
  });
  const [feedback, setFeedback] = useState<QuizFeedback | null>(null);
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

  const saveAttempt = useCallback((attempt: SaveQuizAttemptInput) => {
    pendingAttemptsRef.current.set(attempt.idempotencyKey, attempt);
    writePendingQuizAttempts(pendingAttemptsRef.current.values());
    if (inFlightAttemptKeysRef.current.has(attempt.idempotencyKey)) return;

    inFlightAttemptKeysRef.current.add(attempt.idempotencyKey);
    pendingSaveCountRef.current += 1;
    setPendingSaveCount(count => count + 1);

    void saveQuizAttemptAction(attempt)
      .then(() => {
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
  }, []);

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
    document.documentElement.dataset.quizActive = 'true';

    return () => {
      delete document.documentElement.dataset.quizActive;
    };
  }, []);

  useEffect(() => {
    setHasMounted(true);
    setAnswer('');
    setFailedCardIds(new Set());
    setMissedCardIds(new Set());
    setQuizQueue(shuffleArray(buildQuizQueue(sessionQuizItems)));
    setQuizProgress(buildQuizProgress(sessionQuizItems));
    setAttemptStats({
      totalAttempts: 0,
      correctAttempts: 0,
      incorrectAttempts: 0,
    });
    setFeedback(null);
    pendingSaveCountRef.current = 0;
    pendingAttemptsRef.current.clear();
    failedAttemptKeysRef.current.clear();
    inFlightAttemptKeysRef.current.clear();
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
  }, [saveAttempt, sessionQuizItems]);

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
  const exitQuizButton = (
    <Button
      variant="tertiary"
      size="sm"
      aria-label="Exit quiz and return to Today"
      className="fixed right-4 top-4 z-50 size-10 rounded-full border border-default-200 bg-background/95 p-0 shadow-md backdrop-blur"
      onPress={exitQuiz}
    >
      <HomeIcon className="size-5" aria-hidden="true" />
    </Button>
  );

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
    setFeedback({
      quizItem: currentQuizItem,
      submittedAnswer: answer,
      isCorrect: currentQuizItem.acceptedAnswers.some(
        acceptedAnswer => normalizeAnswer(answer) === normalizeAnswer(acceptedAnswer),
      ),
    });
  };

  const handleContinue = (acceptAnyway = false) => {
    if (!feedback || continueHandledRef.current) return;
    continueHandledRef.current = true;

    const { quizItem } = feedback;
    const isAccepted = feedback.isCorrect || acceptAnyway;
    const currentProgress = quizProgress[quizItem.cardId];
    const nextProgressForCard: QuizProgressItem = {
      ...currentProgress,
      btfPassed: isAccepted && quizItem.direction === 'btf' ? true : currentProgress.btfPassed,
      ftbPassed: isAccepted && quizItem.direction === 'ftb' ? true : currentProgress.ftbPassed,
    };
    const wasAlreadyFullyPassed = currentProgress.btfPassed && currentProgress.ftbPassed;
    const isNowFullyPassed = nextProgressForCard.btfPassed && nextProgressForCard.ftbPassed;
    const completesCard = isAccepted && isNowFullyPassed && !wasAlreadyFullyPassed;
    const cardWasCorrect = !failedCardIds.has(quizItem.cardId) && feedback.isCorrect;

    if (recordAttempts) {
      saveAttempt({
        vocabId: quizItem.cardId,
        mode: studyMode,
        direction: quizItem.direction,
        isCorrect: feedback.isCorrect,
        wasOverridden: acceptAnyway,
        completesCard,
        cardWasCorrect,
        idempotencyKey: attemptKeyRef.current ?? crypto.randomUUID(),
      });
    }

    attemptKeyRef.current = null;

    if (!feedback.isCorrect) {
      setMissedCardIds(previous => new Set(previous).add(quizItem.cardId));
    }

    setAttemptStats(prev => ({
      totalAttempts: prev.totalAttempts + 1,
      correctAttempts: prev.correctAttempts + Number(feedback.isCorrect),
      incorrectAttempts: prev.incorrectAttempts + Number(!feedback.isCorrect),
    }));

    if (isAccepted) {
      const nextQuizProgress: QuizProgress = {
        ...quizProgress,
        [quizItem.cardId]: nextProgressForCard,
      };

      setQuizProgress(nextQuizProgress);
      setQuizQueue(prev => prev?.slice(1) ?? []);

      if (completesCard) {
        setFailedCardIds(prev => {
          const next = new Set(prev);
          next.delete(quizItem.cardId);
          return next;
        });
      } else if (!feedback.isCorrect) {
        setFailedCardIds(prev => new Set(prev).add(quizItem.cardId));
      }
    } else {
      setFailedCardIds(prev => {
        const next = new Set(prev);
        next.add(quizItem.cardId);
        return next;
      });

      setQuizQueue(prev => {
        if (!prev) return null;
        const [, ...remainingItems] = prev;
        return insertLater(remainingItems, quizItem, 2);
      });
    }

    setAnswer('');
    setFeedback(null);
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
            studyMode={studyMode}
            recordAttempts={recordAttempts}
            missedCardCount={missedCardIds.size}
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
        <QuizStats progressStats={progressStats} attemptStats={attemptStats} tone={tone} />

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
            onContinue={() => handleContinue()}
            onAcceptAnyway={
              allowAnswerOverride && !feedback.isCorrect ? () => handleContinue(true) : undefined
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
            onAnswerChange={setAnswer}
            onSubmit={handleAnswerSubmit}
          />
        )}
      </div>
    </>
  );
}
