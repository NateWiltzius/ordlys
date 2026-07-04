import QuizAnswerForm from '@/components/shared/quiz/quiz-answer-form';
import QuizFeedbackPanel from '@/components/shared/quiz/quiz-feedback-panel';
import QuizStats from '@/components/shared/quiz/quiz-stats';
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
} from '@/types/quiz.types';
import { LearnItem, ReviewItem } from '@/types/review.types';
import { Button, Card, ProgressBar } from '@heroui/react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Props = {
  quizItems: LearnItem[] | ReviewItem[];
  onVocabComplete: (vocabId: number, wasCorrect: boolean) => Promise<void>;
};

export default function QuizMode({ quizItems, onVocabComplete }: Props) {
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
  const [isContinuing, setIsContinuing] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

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
  }, [quizItems]);

  const currentQuizItem = quizQueue?.[0];

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

  const handleAnswerSubmit = () => {
    if (!currentQuizItem) return;

    setFeedback({
      quizItem: currentQuizItem,
      submittedAnswer: answer,
      isCorrect: normalizeAnswer(answer) === normalizeAnswer(currentQuizItem.answer),
    });
  };

  const handleContinue = async () => {
    if (!feedback || isContinuing) return;

    setIsContinuing(true);

    try {
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
          await onVocabComplete(quizItem.cardId, !failedCardIds.has(quizItem.cardId));

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
    } finally {
      setIsContinuing(false);
    }
  };

  if (quizQueue === null) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <Card.Header>
            <Card.Title>Preparing quiz</Card.Title>
            <Card.Description>Building your study queue.</Card.Description>
          </Card.Header>
          <Card.Content>
            {hasMounted ? (
              <ProgressBar isIndeterminate aria-label="Preparing quiz" />
            ) : (
              <div className="h-2 w-full animate-pulse rounded-full bg-default-200" />
            )}
          </Card.Content>
        </Card>
      </div>
    );
  }

  if (!currentQuizItem) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Card variant="tertiary">
          <Card.Header>
            <Card.Title>Quiz complete</Card.Title>
            <Card.Description>Nice work. Here is how this session went.</Card.Description>
          </Card.Header>
          <Card.Content>
            <QuizStats progressStats={progressStats} attemptStats={attemptStats} />
          </Card.Content>
          <Card.Footer>
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button variant="primary" className="w-full sm:w-auto">
                Back to dashboard
              </Button>
            </Link>
          </Card.Footer>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <QuizStats progressStats={progressStats} attemptStats={attemptStats} />

      {feedback ? (
        <QuizFeedbackPanel
          feedback={feedback}
          isContinuing={isContinuing}
          onContinue={handleContinue}
        />
      ) : (
        <QuizAnswerForm
          prompt={currentQuizItem.prompt}
          answer={answer}
          direction={currentQuizItem.direction}
          onAnswerChange={setAnswer}
          onSubmit={handleAnswerSubmit}
        />
      )}
    </div>
  );
}
