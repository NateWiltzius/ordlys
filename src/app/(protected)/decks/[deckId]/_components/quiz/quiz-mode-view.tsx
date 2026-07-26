'use client';

import type { useQuizModeController } from './use-quiz-mode-controller';
import QuizStats from './quiz-stats';
import QuizAnswerForm from '@/components/quiz/quiz-answer-form';
import QuizCompletionSummary from '@/components/quiz/quiz-completion-summary';
import QuizFeedbackPanel from '@/components/quiz/quiz-feedback-panel';
import StatusAlert from '@/components/shared/status-alert';
import { getDifficultQuizItems, getSrsMilestoneCounts } from '@/lib/quiz/quiz-completion';
import type { StudyTone } from '@/lib/study-colors';
import type { StudyMode } from '@/types/quiz.types';
import { HomeIcon } from '@heroicons/react/24/outline';
import { Button, ProgressBar } from '@heroui/react';

type Controller = ReturnType<typeof useQuizModeController>;

type Props = {
  controller: Controller;
  completionHref: string;
  tone: StudyTone;
  allowAnswerOverride: boolean;
  studyMode: StudyMode;
  recordAttempts: boolean;
  showExitButton: boolean;
};

export default function QuizModeView({
  controller,
  completionHref,
  tone,
  allowAnswerOverride,
  studyMode,
  recordAttempts,
  showExitButton,
}: Props) {
  const exitButton = showExitButton ? <QuizExitButton onExit={controller.exitQuiz} /> : null;

  if (controller.quizQueue === null) {
    return (
      <>
        {exitButton}
        <QuizPendingState
          tone={tone}
          title="Preparing quiz"
          description="Building your study queue."
          progressLabel="Preparing quiz"
          showProgress={controller.hasMounted}
        />
      </>
    );
  }

  if (!controller.currentQuizItem) {
    if (controller.pendingSaveCount === 0 && !controller.saveError) {
      return (
        <div className="w-full" data-study-tone={tone}>
          <QuizCompletionSummary
            progressStats={controller.progressStats}
            attemptStats={controller.attemptStats}
            firstAttemptStats={controller.firstAttemptStats}
            studyMode={studyMode}
            recordAttempts={recordAttempts}
            missedCardCount={Object.keys(controller.missCounts).length}
            difficultItems={getDifficultQuizItems(
              controller.sessionQuizItems,
              controller.missCounts,
            )}
            milestones={getSrsMilestoneCounts(Object.values(controller.srsTransitions))}
            nextReview={controller.nextReview}
            nextReviewLoading={controller.nextReviewLoading}
            completionHref={completionHref}
            tone={tone}
          />
        </div>
      );
    }

    return (
      <>
        {exitButton}
        <QuizSavingState controller={controller} tone={tone} />
      </>
    );
  }

  return (
    <>
      {exitButton}
      <ActiveQuiz
        controller={controller}
        tone={tone}
        studyMode={studyMode}
        recordAttempts={recordAttempts}
        allowAnswerOverride={allowAnswerOverride}
      />
    </>
  );
}

function ActiveQuiz({
  controller,
  tone,
  studyMode,
  recordAttempts,
  allowAnswerOverride,
}: {
  controller: Controller;
  tone: StudyTone;
  studyMode: StudyMode;
  recordAttempts: boolean;
  allowAnswerOverride: boolean;
}) {
  const feedbackProgress = controller.feedback
    ? controller.quizProgress[controller.feedback.quizItem.cardId]
    : undefined;
  const completesCurrentWord = Boolean(
    controller.feedback?.isCorrect &&
      feedbackProgress &&
      (controller.feedback.quizItem.direction === 'btf'
        ? feedbackProgress.ftbPassed
        : feedbackProgress.btfPassed),
  );
  const wordCompletion: 'clean' | 'recovered' | undefined =
    controller.feedback && completesCurrentWord
      ? controller.failedCardIds.has(controller.feedback.quizItem.cardId)
        ? 'recovered'
        : 'clean'
      : undefined;

  return (
    <div className="w-full space-y-4" data-study-tone={tone}>
      <QuizStats
        progressStats={controller.progressStats}
        attemptStats={controller.attemptStats}
        tone={tone}
        studyMode={studyMode}
      />
      {controller.saveError ? (
        <StatusAlert status="danger" title="Progress not saved">
          <span>{controller.saveError}</span>{' '}
          <Button size="sm" variant="secondary" onPress={controller.retryFailedSaves}>
            Retry now
          </Button>
        </StatusAlert>
      ) : null}
      {!controller.saveError && controller.saveNotice ? (
        <StatusAlert status="warning">{controller.saveNotice}</StatusAlert>
      ) : null}

      {controller.feedback ? (
        <QuizFeedbackPanel
          feedback={controller.feedback}
          studyMode={studyMode}
          wordCompletion={wordCompletion}
          recordAttempts={recordAttempts}
          onContinue={() => controller.continueQuiz()}
          onAcceptAnyway={
            allowAnswerOverride &&
            !controller.feedback.isCorrect &&
            controller.feedback.submittedAnswer.trim()
              ? () => controller.continueQuiz(true)
              : undefined
          }
        />
      ) : (
        <QuizAnswerForm
          prompt={controller.currentQuizItem?.prompt ?? ''}
          hint={controller.currentQuizItem?.hint ?? null}
          answer={controller.answer}
          direction={controller.currentQuizItem?.direction ?? 'btf'}
          frontLanguage={controller.currentSourceItem?.frontLanguage ?? null}
          backLanguage={controller.currentSourceItem?.backLanguage ?? null}
          tone={tone}
          onAnswerChange={controller.changeAnswer}
          onSubmit={controller.submitAnswer}
          onGiveUp={controller.giveUp}
          deckTitle={controller.currentQuizItem?.deckTitle}
          lessonTitle={controller.currentQuizItem?.lessonTitle}
        />
      )}
    </div>
  );
}

function QuizSavingState({ controller, tone }: { controller: Controller; tone: StudyTone }) {
  return (
    <div className="w-full" data-study-tone={tone}>
      <section className="border-y border-default-200 py-6">
        <h2 className="text-lg font-semibold">
          {controller.saveError ? 'Progress needs attention' : 'Saving progress'}
        </h2>
        <p className="mt-1 text-sm text-default-500">
          {controller.saveError
            ? 'Your unsaved answers are stored in this tab so you can retry now or leave safely.'
            : 'Finishing your session.'}
        </p>
        <div className="mt-4 space-y-4">
          {controller.saveError ? (
            <StatusAlert status="danger">{controller.saveError}</StatusAlert>
          ) : (
            <IndeterminateProgress label="Saving quiz progress" />
          )}
        </div>
        {controller.saveError ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="primary" onPress={controller.retryFailedSaves}>
              Retry saving
            </Button>
            <Button variant="tertiary" onPress={controller.exitQuiz}>
              Leave for now
            </Button>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function QuizPendingState({
  tone,
  title,
  description,
  progressLabel,
  showProgress,
}: {
  tone: StudyTone;
  title: string;
  description: string;
  progressLabel: string;
  showProgress: boolean;
}) {
  return (
    <div className="w-full" data-study-tone={tone}>
      <section className="border-y border-default-200 py-6">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-default-500">{description}</p>
        <div className="mt-4">
          {showProgress ? (
            <IndeterminateProgress label={progressLabel} />
          ) : (
            <div className="h-2 w-full animate-pulse rounded-full bg-default-200" />
          )}
        </div>
      </section>
    </div>
  );
}

function IndeterminateProgress({ label }: { label: string }) {
  return (
    <ProgressBar isIndeterminate aria-label={label}>
      <ProgressBar.Track>
        <ProgressBar.Fill />
      </ProgressBar.Track>
    </ProgressBar>
  );
}

function QuizExitButton({ onExit }: { onExit: () => void }) {
  return (
    <Button
      variant="tertiary"
      size="sm"
      aria-label="Exit quiz and return to Today"
      className="fixed right-4 top-4 z-50 size-10 rounded-full border border-default-200 bg-background/95 p-0 shadow-md backdrop-blur"
      onPress={onExit}
    >
      <HomeIcon className="size-5" aria-hidden="true" />
    </Button>
  );
}
