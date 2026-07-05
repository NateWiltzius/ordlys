import { QuizAttemptStats, QuizProgressStats } from '@/types/quiz.types';
import { Card, ProgressBar } from '@heroui/react';
import QuizStat from '@/app/(protected)/decks/[deckId]/_components/quiz/quiz-stat';
import { QUIZ_FEEDBACK_STYLES, STUDY_TONE_STYLES, StudyTone } from '@/lib/study-colors';

type Props = {
  progressStats: QuizProgressStats;
  attemptStats: QuizAttemptStats;
  tone: StudyTone;
};

export default function QuizStats({ progressStats, attemptStats, tone }: Props) {
  return (
    <Card>
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

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuizStat label="Progress" value={`${progressStats.progressPercentage}%`} />
          <QuizStat label="Accuracy" value={`${progressStats.accuracyPercentage}%`} />
          <QuizStat
            label="Correct"
            value={attemptStats.correctAttempts}
            className={QUIZ_FEEDBACK_STYLES.correct.surface}
            valueClassName={QUIZ_FEEDBACK_STYLES.correct.text}
          />
          <QuizStat
            label="Missed"
            value={attemptStats.incorrectAttempts}
            className={QUIZ_FEEDBACK_STYLES.incorrect.surface}
            valueClassName={QUIZ_FEEDBACK_STYLES.incorrect.text}
          />
        </div>
      </Card.Content>
    </Card>
  );
}
