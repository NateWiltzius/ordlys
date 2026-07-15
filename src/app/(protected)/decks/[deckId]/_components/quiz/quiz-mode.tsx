import QuizAnswerForm from '@/app/(protected)/decks/[deckId]/_components/quiz/quiz-answer-form';
import QuizFeedbackPanel from '@/app/(protected)/decks/[deckId]/_components/quiz/quiz-feedback-panel';
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
  StudyMode,
} from '@/types/quiz.types';
import { SrsTransition } from '@/types/review.types';
import { Button, Card, ProgressBar } from '@heroui/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StudyTone } from '@/lib/study-colors';
import { HomeIcon } from '@heroicons/react/24/outline';
import StatusAlert from '@/components/shared/status-alert';
import { recordReviewAttemptAction } from '@/server/review.actions';

type Props = {
  quizItems: QuizSourceItem[];
  onVocabComplete: (vocabId: number, wasCorrect: boolean) => Promise<SrsTransition>;
  completionHref: string;
  tone?: StudyTone;
  allowAnswerOverride?: boolean;
  studyMode: StudyMode;
  recordAttempts?: boolean;
};

export default function QuizMode({
  quizItems,
  onVocabComplete,
  completionHref,
  tone = 'neutral',
  allowAnswerOverride = true,
  studyMode,
  recordAttempts = true,
}: Props) {
  // A server action can reconcile this route with fresh due-card data (for example when an
  // auth cookie is refreshed). Keep the cards that started this session so that reconciliation
  // does not replace the active queue and reset the learner's in-memory progress.
  const [sessionQuizItems] = useState(() => quizItems);
  const [answer, setAnswer] = useState('');
  const [failedCardIds, setFailedCardIds] = useState<Set<number>>(() => new Set());
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
  const [hasMounted, setHasMounted] = useState(false);
  const continueHandledRef = useRef(false);

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
    setQuizQueue(shuffleArray(buildQuizQueue(sessionQuizItems)));
    setQuizProgress(buildQuizProgress(sessionQuizItems));
    setAttemptStats({
      totalAttempts: 0,
      correctAttempts: 0,
      incorrectAttempts: 0,
    });
    setFeedback(null);
    setPendingSaveCount(0);
    setSaveError(null);
    continueHandledRef.current = false;
  }, [sessionQuizItems]);

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
      onPress={() => window.location.assign('/dashboard')}
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

  useEffect(() => {
    if (quizQueue !== null && quizQueue.length === 0 && pendingSaveCount === 0) {
      window.location.replace(completionHref);
    }
  }, [completionHref, pendingSaveCount, quizQueue]);

  const handleAnswerSubmit = () => {
    if (!currentQuizItem) return;

    continueHandledRef.current = false;
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
    const isCorrect = feedback.isCorrect || acceptAnyway;

    if (recordAttempts) {
      setPendingSaveCount(count => count + 1);
      void recordReviewAttemptAction(
        quizItem.cardId,
        studyMode,
        quizItem.direction,
        isCorrect,
        acceptAnyway,
      )
        .catch(() => {
          setSaveError('Could not save this answer to your review history.');
        })
        .finally(() => {
          setPendingSaveCount(count => Math.max(0, count - 1));
        });
    }

    setAttemptStats(prev => ({
      totalAttempts: prev.totalAttempts + 1,
      correctAttempts: prev.correctAttempts + Number(isCorrect),
      incorrectAttempts: prev.incorrectAttempts + Number(!isCorrect),
    }));

    if (isCorrect) {
      const currentProgress = quizProgress[quizItem.cardId];

      const nextProgressForCard: QuizProgressItem = {
        ...currentProgress,
        btfPassed: quizItem.direction === 'btf' ? true : currentProgress.btfPassed,
        ftbPassed: quizItem.direction === 'ftb' ? true : currentProgress.ftbPassed,
      };

      const nextQuizProgress: QuizProgress = {
        ...quizProgress,
        [quizItem.cardId]: nextProgressForCard,
      };

      const wasAlreadyFullyPassed = currentProgress.btfPassed && currentProgress.ftbPassed;
      const isNowFullyPassed = nextProgressForCard.btfPassed && nextProgressForCard.ftbPassed;

      setQuizProgress(nextQuizProgress);
      setQuizQueue(prev => prev?.slice(1) ?? []);

      if (isNowFullyPassed && !wasAlreadyFullyPassed) {
        const completedVocab = sessionQuizItems.find(item => item.id === quizItem.cardId);
        const vocabLabel = completedVocab?.front ?? quizItem.prompt;

        setPendingSaveCount(count => count + 1);
        void onVocabComplete(quizItem.cardId, !failedCardIds.has(quizItem.cardId))
          .catch(() => {
            setSaveError(`Could not save progress for ${vocabLabel}.`);
          })
          .finally(() => {
            setPendingSaveCount(count => Math.max(0, count - 1));
          });

        setFailedCardIds(prev => {
          const next = new Set(prev);
          next.delete(quizItem.cardId);
          return next;
        });
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
        <div className="w-full">
          <Card>
            <Card.Header>
              <Card.Title>Preparing quiz</Card.Title>
              <Card.Description>Building your study queue.</Card.Description>
            </Card.Header>
            <Card.Content>
              {hasMounted ? (
                <ProgressBar isIndeterminate aria-label="Preparing quiz">
                  <ProgressBar.Track>
                    <ProgressBar.Fill />
                  </ProgressBar.Track>
                </ProgressBar>
              ) : (
                <div className="h-2 w-full animate-pulse rounded-full bg-default-200" />
              )}
            </Card.Content>
          </Card>
        </div>
      </>
    );
  }

  if (!currentQuizItem) {
    if (pendingSaveCount === 0) return null;

    return (
      <>
        {exitQuizButton}
        <div className="w-full">
          <Card>
            <Card.Header>
              <Card.Title>Saving progress</Card.Title>
              <Card.Description>Finishing your session.</Card.Description>
            </Card.Header>
            <Card.Content>
              <ProgressBar isIndeterminate aria-label="Saving quiz progress">
                <ProgressBar.Track>
                  <ProgressBar.Fill />
                </ProgressBar.Track>
              </ProgressBar>
            </Card.Content>
          </Card>
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
      <div className="w-full space-y-4">
        <QuizStats progressStats={progressStats} attemptStats={attemptStats} tone={tone} />

        {saveError ? (
          <StatusAlert status="danger" title="Progress not saved">
            {saveError}
          </StatusAlert>
        ) : null}

        {feedback ? (
          <QuizFeedbackPanel
            feedback={feedback}
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
