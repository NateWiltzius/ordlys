import ButtonLink from '@/components/shared/button-link';
import StatTile from '@/components/shared/stat-tile';
import { getQuizCompletionContent } from '@/lib/quiz/quiz-completion';
import { QUIZ_FEEDBACK_STYLES, STUDY_TONE_STYLES, type StudyTone } from '@/lib/study-colors';
import type { QuizAttemptStats, QuizProgressStats, StudyMode } from '@/types/quiz.types';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { Card } from '@heroui/react';

type Props = {
  progressStats: QuizProgressStats;
  attemptStats: QuizAttemptStats;
  studyMode: StudyMode;
  recordAttempts: boolean;
  missedCardCount: number;
  completionHref: string;
  tone: StudyTone;
};

export default function QuizCompletionSummary({
  progressStats,
  attemptStats,
  studyMode,
  recordAttempts,
  missedCardCount,
  completionHref,
  tone,
}: Props) {
  const content = getQuizCompletionContent({
    studyMode,
    recordAttempts,
    completedCards: progressStats.completedCards,
    totalCards: progressStats.totalCards,
    missedCardCount,
  });
  const returnsToToday = completionHref === '/dashboard';

  return (
    <Card className="overflow-hidden" data-study-tone={tone}>
      <Card.Header className="flex-row items-start gap-3">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${STUDY_TONE_STYLES[tone].accent}`}
        >
          <CheckCircleIcon className="size-6" aria-hidden="true" />
        </span>
        <div>
          <Card.Title className={STUDY_TONE_STYLES[tone].text} render={props => <h2 {...props} />}>
            {content.title}
          </Card.Title>
          <Card.Description>{content.description}</Card.Description>
        </div>
      </Card.Header>

      <Card.Content className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <StatTile
            label={content.completedLabel}
            value={progressStats.completedCards}
            className={STUDY_TONE_STYLES[tone].surface}
            valueClassName={STUDY_TONE_STYLES[tone].text}
          />
          <StatTile label="Accuracy" value={`${progressStats.accuracyPercentage}%`} />
          <StatTile
            label="Correct answers"
            value={attemptStats.correctAttempts}
            className={QUIZ_FEEDBACK_STYLES.correct.surface}
            valueClassName={QUIZ_FEEDBACK_STYLES.correct.text}
          />
          <StatTile
            label="Missed answers"
            value={attemptStats.incorrectAttempts}
            className={QUIZ_FEEDBACK_STYLES.incorrect.surface}
            valueClassName={QUIZ_FEEDBACK_STYLES.incorrect.text}
          />
        </div>

        {content.detail ? (
          <p className="rounded-lg bg-default-100 px-4 py-3 text-sm text-default-600">
            {content.detail}
          </p>
        ) : null}
      </Card.Content>

      <Card.Footer className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {!returnsToToday ? (
          <ButtonLink href="/dashboard" variant="secondary" className="w-full sm:w-auto">
            Back to Today
          </ButtonLink>
        ) : null}
        <ButtonLink
          href={completionHref}
          className={`w-full sm:w-auto ${STUDY_TONE_STYLES[tone].button}`}
        >
          {returnsToToday ? 'Back to Today' : 'Back to deck'}
        </ButtonLink>
      </Card.Footer>
    </Card>
  );
}
