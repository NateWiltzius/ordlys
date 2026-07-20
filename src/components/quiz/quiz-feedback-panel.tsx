'use client';

import { QuizFeedback, StudyMode } from '@/types/quiz.types';
import { Button, Chip } from '@heroui/react';
import { useEffect, useRef } from 'react';
import AnswerRow from '@/components/quiz/answer-row';
import { QUIZ_FEEDBACK_STYLES } from '@/lib/study-colors';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { getQuizLanguageLabels } from '@/lib/quiz/quiz-language-labels';
import {
  getDirectionProgressContent,
  getWordCompletionContent,
  WordCompletion,
} from '@/lib/quiz/quiz-feedback';
import { getAnswerDifference } from '@/lib/quiz/answer-difference';
import { normalizeAnswer } from '@/lib/quiz/normalize';

type Props = {
  feedback: QuizFeedback;
  studyMode: StudyMode;
  wordCompletion?: WordCompletion;
  onContinue: () => void;
  onAcceptAnyway?: () => void;
  keyboardShortcutEnabled?: boolean;
  recordAttempts?: boolean;
};

export default function QuizFeedbackPanel({
  feedback,
  studyMode,
  wordCompletion,
  onContinue,
  onAcceptAnyway,
  keyboardShortcutEnabled = true,
  recordAttempts = true,
}: Props) {
  const styles = feedback.isCorrect ? QUIZ_FEEDBACK_STYLES.correct : QUIZ_FEEDBACK_STYLES.incorrect;
  const wordCompletionContent = wordCompletion
    ? getWordCompletionContent(
        studyMode,
        wordCompletion,
        feedback.quizItem.srsLevel ?? null,
        recordAttempts,
      )
    : getDirectionProgressContent(feedback.isCorrect, recordAttempts);
  const completionStyles = wordCompletionContent.isWarning
    ? QUIZ_FEEDBACK_STYLES.incorrect
    : QUIZ_FEEDBACK_STYLES.correct;
  const shownLanguageCode =
    feedback.quizItem.direction === 'btf'
      ? feedback.quizItem.backLanguage
      : feedback.quizItem.frontLanguage;
  const languageLabels = getQuizLanguageLabels(
    feedback.quizItem.direction,
    feedback.quizItem.frontLanguage,
    feedback.quizItem.backLanguage,
  );
  const onContinueRef = useRef(onContinue);
  const answerDifference = getAnswerDifference(feedback.submittedAnswer, feedback.quizItem.answer);
  const canonicalAnswer = normalizeAnswer(feedback.quizItem.answer);
  const acceptedAlternatives = [
    ...new Map(
      feedback.quizItem.acceptedAnswers
        .filter(answer => normalizeAnswer(answer) !== canonicalAnswer)
        .map(answer => [normalizeAnswer(answer), answer]),
    ).values(),
  ];

  useEffect(() => {
    onContinueRef.current = onContinue;
  }, [onContinue]);

  useEffect(() => {
    if (!keyboardShortcutEnabled) return;

    // React can mount this listener before the submitting Enter event has finished
    // bubbling. Arm it after that event completes so only a new keypress continues.
    let shortcutReady = false;
    queueMicrotask(() => {
      shortcutReady = true;
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const isInteractiveTarget =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.matches('input, textarea, select, button, a[href], [role="button"]'));

      if (
        !shortcutReady ||
        event.defaultPrevented ||
        isInteractiveTarget ||
        event.key !== 'Enter' ||
        event.repeat ||
        event.isComposing
      ) {
        return;
      }

      event.preventDefault();
      onContinueRef.current();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [keyboardShortcutEnabled]);

  return (
    <section className="border-y border-default-200 py-5 sm:py-6">
      <header
        className={`flex flex-col gap-3 rounded-lg border px-3 py-3 sm:flex-row sm:items-start sm:justify-between ${styles.surface}`}
      >
        <div className="flex items-start gap-2">
          {feedback.isCorrect ? (
            <CheckCircleIcon
              className={`mt-0.5 size-5 shrink-0 ${styles.text}`}
              aria-hidden="true"
            />
          ) : (
            <ExclamationCircleIcon
              className={`mt-0.5 size-5 shrink-0 ${styles.text}`}
              aria-hidden="true"
            />
          )}
          <div>
            <h2 className={`font-semibold ${styles.text}`}>
              {feedback.isCorrect ? 'Correct' : 'Not quite'}
            </h2>
            <p className="text-sm text-default-600">
              {feedback.isCorrect
                ? 'Good answer. Continue to the next card.'
                : 'Review the correct answer before continuing.'}
            </p>
          </div>
        </div>

        <Chip
          size="sm"
          color="default"
          variant="soft"
          className="max-w-full shrink-0"
          title={languageLabels.directionLabel}
        >
          <span className="truncate">{languageLabels.directionLabel}</span>
        </Chip>
      </header>

      <div className="py-7 text-center sm:py-9">
        {feedback.quizItem.deckTitle || feedback.quizItem.lessonTitle ? (
          <p className="mb-3 truncate text-xs font-medium text-default-500">
            {[feedback.quizItem.deckTitle, feedback.quizItem.lessonTitle]
              .filter(Boolean)
              .join(' · ')}
          </p>
        ) : null}
        <p className="text-xs font-semibold uppercase text-default-500">
          {languageLabels.promptRowLabel}
        </p>
        <p
          className="mt-3 break-words text-4xl leading-tight font-semibold sm:text-5xl"
          lang={shownLanguageCode ?? undefined}
        >
          {feedback.quizItem.prompt}
        </p>
      </div>

      <div className="space-y-3">
        <div
          role="status"
          className={`flex items-start gap-2 border-l-4 px-3 py-2 ${
            wordCompletionContent.isWarning
              ? 'border-danger bg-danger/10'
              : 'border-success bg-success/10'
          }`}
        >
          {wordCompletionContent.isWarning ? (
            <ExclamationCircleIcon
              className={`mt-0.5 size-5 shrink-0 ${completionStyles.text}`}
              aria-hidden="true"
            />
          ) : (
            <CheckCircleIcon
              className={`mt-0.5 size-5 shrink-0 ${completionStyles.text}`}
              aria-hidden="true"
            />
          )}
          <div>
            <p className={`font-semibold ${completionStyles.text}`}>
              {wordCompletionContent.title}
            </p>
            <p className="text-sm text-foreground/80">{wordCompletionContent.description}</p>
          </div>
        </div>
        <div className="divide-y divide-default-200 border-y border-default-200">
          {feedback.quizItem.hint ? (
            <AnswerRow label="Hint" value={feedback.quizItem.hint} />
          ) : null}
          {feedback.quizItem.reading ? (
            <AnswerRow label="Reading" value={feedback.quizItem.reading} />
          ) : null}
          <AnswerRow
            label="Your answer"
            value={feedback.submittedAnswer.trim() || 'No answer'}
            difference={answerDifference?.submitted}
            differenceTone="incorrect"
          />
          <AnswerRow
            label={languageLabels.correctAnswerRowLabel}
            value={feedback.quizItem.answer}
            difference={answerDifference?.correct}
            differenceTone="correct"
          />
          {acceptedAlternatives.length > 0 ? (
            <AnswerRow label="Also accepted" value={acceptedAlternatives.join(' · ')} />
          ) : null}
          {feedback.quizItem.notes ? (
            <AnswerRow label="Notes" value={feedback.quizItem.notes} preserveWhitespace />
          ) : null}
        </div>
      </div>

      <footer className="mt-5 space-y-3">
        {!feedback.isCorrect && onAcceptAnyway ? (
          <p className="text-sm text-default-500 sm:text-right">
            Accept anyway counts this response as correct once. It does not add a new accepted
            answer.
          </p>
        ) : null}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="hidden text-xs text-default-500 sm:block">
            Press <kbd className="rounded border border-default-300 px-1.5 py-0.5">Enter</kbd> to
            continue
          </p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            {!feedback.isCorrect && onAcceptAnyway ? (
              <Button variant="secondary" onPress={onAcceptAnyway} className="w-full sm:w-auto">
                Accept anyway
              </Button>
            ) : null}
            <Button
              variant="primary"
              onPress={onContinue}
              className={`w-full sm:w-auto ${styles.button}`}
            >
              Continue
            </Button>
          </div>
        </div>
      </footer>
    </section>
  );
}
