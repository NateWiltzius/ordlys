import { QuizAttemptStats, QuizProgressStats } from '@/types/quiz.types';
import { Card, ProgressBar } from '@heroui/react';

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
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Progress" value={`${progressStats.progressPercentage}%`} />
          <Stat label="Accuracy" value={`${progressStats.accuracyPercentage}%`} />
          <Stat label="Correct" value={attemptStats.correctAttempts} />
          <Stat label="Missed" value={attemptStats.incorrectAttempts} />
        </div>
      </Card.Content>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-default-100 px-3 py-2">
      <p className="text-sm text-default-500">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
