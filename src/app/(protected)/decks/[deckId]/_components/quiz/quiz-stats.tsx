import { QuizAttemptStats, QuizProgressStats } from '@/types/quiz.types';
import { QUIZ_FEEDBACK_STYLES, StudyTone } from '@/lib/study-colors';
import StudyProgress from '@/components/shared/study-progress';
import type { StudyMode } from '@/types/quiz.types';

type Props = {
  progressStats: QuizProgressStats;
  attemptStats: QuizAttemptStats;
  tone: StudyTone;
  studyMode: StudyMode;
};

export default function QuizStats({ progressStats, attemptStats, tone, studyMode }: Props) {
  const unit = studyMode === 'review' ? 'reviews' : 'words';

  return (
    <StudyProgress
      label="Study progress"
      counter={
        <>
          {progressStats.completedCards} / {progressStats.totalCards} {unit}
        </>
      }
      value={progressStats.progressPercentage}
      ariaLabel={studyMode === 'review' ? 'Review progress' : 'Learning progress'}
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
