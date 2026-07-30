import ButtonLink from '@/components/shared/button-link';
import NextReviewText from '@/components/shared/next-review-text';
import StatTile from '@/components/shared/stat-tile';
import {
  getMilestoneSummary,
  getQuizCompletionContent,
  type SrsMilestoneCounts,
} from '@/lib/quiz/quiz-completion';
import { QUIZ_FEEDBACK_STYLES, STUDY_TONE_STYLES, type StudyTone } from '@/lib/study-colors';
import type {
  QuizAttemptStats,
  QuizDifficultItem,
  QuizFirstAttemptStats,
  QuizProgressStats,
  StudyMode,
} from '@/types/quiz.types';
import type { NextReviewBatch } from '@/types/review.types';
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@heroui/react';

type Props = {
  progressStats: QuizProgressStats;
  attemptStats: QuizAttemptStats;
  firstAttemptStats: QuizFirstAttemptStats;
  studyMode: StudyMode;
  recordAttempts: boolean;
  missedCardCount: number;
  difficultItems: QuizDifficultItem[];
  milestones: SrsMilestoneCounts;
  nextReview: NextReviewBatch | null;
  nextReviewLoading: boolean;
  completionHref: string;
  tone: StudyTone;
};

export default function QuizCompletionSummary({
  progressStats,
  attemptStats,
  firstAttemptStats,
  studyMode,
  recordAttempts,
  missedCardCount,
  difficultItems,
  milestones,
  nextReview,
  nextReviewLoading,
  completionHref,
  tone,
}: Props) {
  const content = getQuizCompletionContent({
    studyMode,
    recordAttempts,
    completedCards: progressStats.completedCards,
    totalCards: progressStats.totalCards,
    missedCardCount,
    usesOneWayCards: progressStats.totalDirections < progressStats.totalCards * 2,
  });
  const returnsToToday = completionHref === '/dashboard';
  const cleanCardCount = Math.max(0, progressStats.completedCards - missedCardCount);
  const milestoneSummary = getMilestoneSummary(milestones);

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
          <StatTile label="First-try accuracy" value={`${firstAttemptStats.accuracyPercentage}%`} />
          <StatTile
            label={content.cleanLabel}
            value={cleanCardCount}
            className={QUIZ_FEEDBACK_STYLES.correct.surface}
            valueClassName={QUIZ_FEEDBACK_STYLES.correct.text}
          />
          <StatTile
            label={content.missedLabel}
            value={missedCardCount}
            className={QUIZ_FEEDBACK_STYLES.incorrect.surface}
            valueClassName={QUIZ_FEEDBACK_STYLES.incorrect.text}
          />
        </div>

        <p className="text-sm text-default-500">
          {attemptStats.correctAttempts} accepted · {attemptStats.incorrectAttempts} missed across{' '}
          {attemptStats.totalAttempts} {attemptStats.totalAttempts === 1 ? 'attempt' : 'attempts'}
        </p>

        {milestoneSummary ? (
          <div
            role="status"
            className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${STUDY_TONE_STYLES[tone].surface}`}
          >
            <SparklesIcon
              className={`mt-0.5 size-5 shrink-0 ${STUDY_TONE_STYLES[tone].text}`}
              aria-hidden="true"
            />
            <div>
              <h3 className={`font-semibold ${STUDY_TONE_STYLES[tone].text}`}>Memory milestone</h3>
              <p className="text-sm text-foreground/80">{milestoneSummary}</p>
            </div>
          </div>
        ) : null}

        {content.detail ? (
          <p className="rounded-lg bg-default-100 px-4 py-3 text-sm text-default-600">
            {content.detail}
          </p>
        ) : null}

        {difficultItems.length > 0 ? (
          <section className="overflow-hidden rounded-lg border border-danger/30 bg-danger/5">
            <header className="flex items-start gap-3 px-4 py-3">
              <ExclamationCircleIcon
                className="mt-0.5 size-5 shrink-0 text-danger"
                aria-hidden="true"
              />
              <div>
                <h3 className="font-semibold text-danger">Cards to revisit</h3>
                <p className="text-sm text-default-600">
                  These needed the most help during this session.
                </p>
              </div>
            </header>
            <ol className="divide-y divide-danger/20 border-y border-danger/20 bg-background/50">
              {difficultItems.map(item => (
                <li
                  key={item.id}
                  className="grid gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="break-words font-medium">
                      <span lang={item.frontLanguage ?? undefined}>{item.front}</span>
                      <span className="px-2 text-default-400" aria-hidden="true">
                        →
                      </span>
                      <span lang={item.backLanguage ?? undefined}>{item.back}</span>
                    </p>
                    {item.deckTitle || item.lessonTitle ? (
                      <p className="mt-0.5 truncate text-xs text-default-500">
                        {[item.deckTitle, item.lessonTitle].filter(Boolean).join(' · ')}
                      </p>
                    ) : null}
                  </div>
                  <span className="w-fit rounded-full bg-danger/10 px-2 py-1 text-xs font-medium text-danger">
                    {item.missCount} {item.missCount === 1 ? 'miss' : 'misses'}
                  </span>
                </li>
              ))}
            </ol>
            {recordAttempts ? (
              <div className="px-4 py-3">
                <ButtonLink
                  href="/practice/recent-mistakes"
                  variant="secondary"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  Practice missed cards
                </ButtonLink>
              </div>
            ) : null}
          </section>
        ) : null}

        {recordAttempts ? (
          <section className="flex items-start gap-3 rounded-lg border border-default-200 bg-default-50 px-4 py-3">
            <ClockIcon className="mt-0.5 size-5 shrink-0 text-default-500" aria-hidden="true" />
            <div>
              <h3 className="font-semibold">What&apos;s next</h3>
              {nextReviewLoading ? (
                <p className="mt-1 text-sm text-default-500">Checking your review schedule…</p>
              ) : nextReview ? (
                <NextReviewText
                  nextReview={nextReview}
                  className="mt-1 block text-sm text-default-600"
                />
              ) : (
                <p className="mt-1 text-sm text-default-500">
                  No more reviews are currently scheduled.
                </p>
              )}
            </div>
          </section>
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
