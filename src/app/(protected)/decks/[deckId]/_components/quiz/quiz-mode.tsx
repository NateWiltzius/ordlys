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
} from '@/types/quiz.types';
import { SrsTransition } from '@/types/review.types';
import { Alert, Button, Card, ProgressBar } from '@heroui/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_SRS_CONFIG, SRS_LEVEL_LABELS } from '@/lib/srs/srs-config';
import { StudyTone } from '@/lib/study-colors';
import { HomeIcon } from '@heroicons/react/24/outline';

type SrsUpdate = {
  status: 'success' | 'warning' | 'danger';
  title: string;
  description: string;
};

type Props = {
  quizItems: QuizSourceItem[];
  onVocabComplete: (vocabId: number, wasCorrect: boolean) => Promise<SrsTransition>;
  completionHref: string;
  tone?: StudyTone;
};

export default function QuizMode({
  quizItems,
  onVocabComplete,
  completionHref,
  tone = 'neutral',
}: Props) {
  const [answer, setAnswer] = useState('');
  const [failedCardIds, setFailedCardIds] = useState<Set<number>>(() => new Set());
  const [quizQueue, setQuizQueue] = useState<QuizQueueItem[] | null>(null);
  const [quizProgress, setQuizProgress] = useState<QuizProgress>(() =>
    buildQuizProgress(quizItems),
  );
  const [attemptStats, setAttemptStats] = useState<QuizAttemptStats>({
    totalAttempts: 0,
    correctAttempts: 0,
    incorrectAttempts: 0,
  });
  const [feedback, setFeedback] = useState<QuizFeedback | null>(null);
  const [pendingSaveCount, setPendingSaveCount] = useState(0);
  const [srsUpdate, setSrsUpdate] = useState<SrsUpdate | null>(null);
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
    setQuizQueue(shuffleArray(buildQuizQueue(quizItems)));
    setQuizProgress(buildQuizProgress(quizItems));
    setAttemptStats({
      totalAttempts: 0,
      correctAttempts: 0,
      incorrectAttempts: 0,
    });
    setFeedback(null);
    setPendingSaveCount(0);
    setSrsUpdate(null);
    continueHandledRef.current = false;
  }, [quizItems]);

  const currentQuizItem = quizQueue?.[0];
  const exitQuizButton = (
    <Button
      variant="tertiary"
      size="sm"
      aria-label="Exit quiz and go to dashboard"
      className="fixed right-4 top-4 z-50 size-10 rounded-full border border-default-200 bg-background/95 p-0 shadow-md backdrop-blur"
      onPress={() => window.location.assign('/dashboard')}
    >
      <HomeIcon className="size-5" aria-hidden="true" />
    </Button>
  );

  const progressStats: QuizProgressStats = useMemo(() => {
    const progressItems = Object.values(quizProgress);
    const totalCards = quizItems.length;
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
  }, [quizItems.length, quizProgress, attemptStats]);

  useEffect(() => {
    if (quizQueue !== null && quizQueue.length === 0 && pendingSaveCount === 0) {
      window.location.replace(completionHref);
    }
  }, [completionHref, pendingSaveCount, quizQueue]);

  useEffect(() => {
    if (!srsUpdate) return;

    const timeout = window.setTimeout(
      () => setSrsUpdate(null),
      srsUpdate.status === 'danger' ? 8000 : 3500,
    );

    return () => window.clearTimeout(timeout);
  }, [srsUpdate]);

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

  const handleContinue = () => {
    if (!feedback || continueHandledRef.current) return;
    continueHandledRef.current = true;

    const { quizItem, isCorrect } = feedback;

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
        const completedVocab = quizItems.find(item => item.id === quizItem.cardId);
        const vocabLabel = completedVocab?.front ?? quizItem.prompt;

        setPendingSaveCount(count => count + 1);
        void onVocabComplete(quizItem.cardId, !failedCardIds.has(quizItem.cardId))
          .then(transition => {
            setSrsUpdate(buildSrsUpdate(vocabLabel, transition));
          })
          .catch(() => {
            setSrsUpdate({
              status: 'danger',
              title: 'Progress not saved',
              description: `Could not save progress for ${vocabLabel}.`,
            });
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
              <Card.Description>Returning to your deck.</Card.Description>
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

  return (
    <>
      {exitQuizButton}
      {srsUpdate ? (
        <Alert
          status={srsUpdate.status}
          role="status"
          className="pointer-events-none fixed left-1/2 top-16 z-40 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 shadow-xl"
        >
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{srsUpdate.title}</Alert.Title>
            <Alert.Description>{srsUpdate.description}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}
      <div className="w-full space-y-4">
        <QuizStats progressStats={progressStats} attemptStats={attemptStats} tone={tone} />

        {feedback ? (
          <QuizFeedbackPanel feedback={feedback} onContinue={handleContinue} />
        ) : (
          <QuizAnswerForm
            prompt={currentQuizItem.prompt}
            answer={answer}
            direction={currentQuizItem.direction}
            frontLanguage={quizItems[0]?.frontLanguage ?? null}
            backLanguage={quizItems[0]?.backLanguage ?? null}
            tone={tone}
            onAnswerChange={setAnswer}
            onSubmit={handleAnswerSubmit}
          />
        )}
      </div>
    </>
  );
}

function formatSrsTransition({ previousLevel, nextLevel }: SrsTransition) {
  if (nextLevel === null) {
    return 'Remains Not started';
  }

  const nextLabel = formatSrsLevel(nextLevel);

  if (previousLevel === null) {
    return `Started at ${nextLabel}`;
  }

  if (previousLevel === nextLevel) {
    return `Remains at ${nextLabel}`;
  }

  return `${formatSrsLevel(previousLevel)} → ${nextLabel}`;
}

function buildSrsUpdate(vocabLabel: string, transition: SrsTransition): SrsUpdate {
  const levelIncreased =
    transition.nextLevel !== null &&
    (transition.previousLevel === null || transition.nextLevel > transition.previousLevel);
  const levelDecreased =
    transition.previousLevel !== null &&
    (transition.nextLevel === null || transition.nextLevel < transition.previousLevel);

  return {
    status: levelDecreased ? 'warning' : 'success',
    title: levelIncreased ? 'Level up' : levelDecreased ? 'Review needs work' : 'Review saved',
    description: `${vocabLabel}: ${formatSrsTransition(transition)}`,
  };
}

function formatSrsLevel(srsLevel: number) {
  const normalizedLevel = Math.min(
    DEFAULT_SRS_CONFIG.maxLevel,
    Math.max(DEFAULT_SRS_CONFIG.initialLevel, srsLevel),
  );

  return `Level ${normalizedLevel + 1} · ${SRS_LEVEL_LABELS[normalizedLevel]}`;
}
