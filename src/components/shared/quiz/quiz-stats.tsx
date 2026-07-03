import { QuizAttemptStats, QuizProgressStats } from '@/types/quiz.types';

type Props = {
  progressStats: QuizProgressStats;
  attemptStats: QuizAttemptStats;
};

export default function QuizStats({ progressStats, attemptStats }: Props) {
  return (
    <>
      <p>
        Completed {progressStats.completedCards} of {progressStats.totalCards} cards
      </p>
      <p>Accuracy: {progressStats.accuracyPercentage}%</p>
      <p>
        Correct answers: {attemptStats.correctAttempts} / {attemptStats.totalAttempts}
      </p>
      <p>Incorrect answers: {attemptStats.incorrectAttempts}</p>
    </>
  );
}
