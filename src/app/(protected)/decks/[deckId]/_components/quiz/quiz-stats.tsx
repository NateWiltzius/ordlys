import { QuizAttemptStats, QuizProgressStats } from '@/types/quiz.types';
import { QUIZ_FEEDBACK_STYLES, StudyTone } from '@/lib/study-colors';
import StudyProgress from '@/components/shared/study-progress';

type Props = {
  progressStats: QuizProgressStats;
  attemptStats: QuizAttemptStats;
  tone: StudyTone;
};

export default function QuizStats({ progressStats, attemptStats, tone }: Props) {
  return (
    <StudyProgress
      label="Study progress"
      counter={
        <>
          {progressStats.completedCards} / {progressStats.totalCards} cards
        </>
      }
      value={progressStats.progressPercentage}
      ariaLabel="Quiz progress"
      tone={tone}
      details={
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>{progressStats.accuracyPercentage}% accuracy</span>
          <span className={QUIZ_FEEDBACK_STYLES.correct.text}>
            {attemptStats.correctAttempts} correct
          </span>
          <span className={QUIZ_FEEDBACK_STYLES.incorrect.text}>
            {attemptStats.incorrectAttempts} missed
          </span>
        </div>
      }
    />
  );
}
