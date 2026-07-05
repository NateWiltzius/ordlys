import { QuizAttemptStats, QuizProgressStats } from '@/types/quiz.types';
import { Card, ProgressBar } from '@heroui/react';
import StatTile from '@/components/shared/stat-tile';
import { QUIZ_FEEDBACK_STYLES, STUDY_TONE_STYLES, StudyTone } from '@/lib/study-colors';

type Props = {
  progressStats: QuizProgressStats;
  attemptStats: QuizAttemptStats;
  tone: StudyTone;
};

export default function QuizStats({ progressStats, attemptStats, tone }: Props) {
  return (
    <>
      <div className="space-y-2 rounded-xl border border-default-200 bg-default-50 px-3 py-2 sm:hidden">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="font-medium">
            {progressStats.completedCards}/{progressStats.totalCards} cards
          </span>
          <span className="text-default-500">{progressStats.accuracyPercentage}% accuracy</span>
        </div>
        <ProgressBar aria-label="Quiz progress" value={progressStats.progressPercentage} size="sm">
          <ProgressBar.Track>
            <ProgressBar.Fill className={STUDY_TONE_STYLES[tone].progress} />
          </ProgressBar.Track>
        </ProgressBar>
      </div>

      <Card className="hidden sm:block">
        <Card.Header>
          <Card.Title>Study progress</Card.Title>
          <Card.Description>
            {progressStats.completedCards} of {progressStats.totalCards} cards completed
          </Card.Description>
        </Card.Header>

        <Card.Content className="space-y-4">
          <ProgressBar aria-label="Quiz progress" value={progressStats.progressPercentage}>
            <ProgressBar.Track>
              <ProgressBar.Fill className={STUDY_TONE_STYLES[tone].progress} />
            </ProgressBar.Track>
          </ProgressBar>

          <div className="grid grid-cols-4 gap-3">
            <StatTile label="Progress" value={`${progressStats.progressPercentage}%`} />
            <StatTile label="Accuracy" value={`${progressStats.accuracyPercentage}%`} />
            <StatTile
              label="Correct"
              value={attemptStats.correctAttempts}
              className={QUIZ_FEEDBACK_STYLES.correct.surface}
              valueClassName={QUIZ_FEEDBACK_STYLES.correct.text}
            />
            <StatTile
              label="Missed"
              value={attemptStats.incorrectAttempts}
              className={QUIZ_FEEDBACK_STYLES.incorrect.surface}
              valueClassName={QUIZ_FEEDBACK_STYLES.incorrect.text}
            />
          </div>
        </Card.Content>
      </Card>
    </>
  );
}
