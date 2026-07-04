import { QuizAttemptStats, QuizProgressStats } from '@/types/quiz.types';
import { Card, ProgressBar } from '@heroui/react';
import QuizStat from '@/app/(protected)/decks/[deckId]/_components/quiz/quiz-stat';

type Props = {
  progressStats: QuizProgressStats;
  attemptStats: QuizAttemptStats;
};

export default function QuizStats({ progressStats, attemptStats }: Props) {
  return (
    <Card>
      <Card.Header>
        <Card.Title>Study progress</Card.Title>
        <Card.Description>
          {progressStats.completedCards} of {progressStats.totalCards} cards completed
        </Card.Description>
      </Card.Header>

      <Card.Content className="space-y-4">
        <ProgressBar
          aria-label="Quiz progress"
          value={progressStats.progressPercentage}
          color="success"
        >
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuizStat label="Progress" value={`${progressStats.progressPercentage}%`} />
          <QuizStat label="Accuracy" value={`${progressStats.accuracyPercentage}%`} />
          <QuizStat label="Correct" value={attemptStats.correctAttempts} />
          <QuizStat label="Missed" value={attemptStats.incorrectAttempts} />
        </div>
      </Card.Content>
    </Card>
  );
}
