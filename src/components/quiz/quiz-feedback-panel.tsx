'use client';

import { QuizFeedback } from '@/types/quiz.types';
import { Button, Chip } from '@heroui/react';
import { useEffect, useRef } from 'react';
import AnswerRow from '@/components/quiz/answer-row';
import { QUIZ_FEEDBACK_STYLES } from '@/lib/study-colors';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { getQuizLanguageLabels } from '@/lib/quiz/quiz-language-labels';

type WordCompletion = 'clean' | 'recovered';

type Props = {
  feedback: QuizFeedback;
  wordCompletion?: WordCompletion;
  onContinue: () => void;
  onAcceptAnyway?: () => void;
  keyboardShortcutEnabled?: boolean;
};

const KEYBOARD_SHORTCUT_DELAY = 250;

export default function QuizFeedbackPanel({
  feedback,
  wordCompletion,
  onContinue,
  onAcceptAnyway,
  keyboardShortcutEnabled = true,
}: Props) {
  const styles = feedback.isCorrect ? QUIZ_FEEDBACK_STYLES.correct : QUIZ_FEEDBACK_STYLES.incorrect;
  const completionStyles =
    wordCompletion === 'recovered' ? QUIZ_FEEDBACK_STYLES.incorrect : QUIZ_FEEDBACK_STYLES.correct;
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

  useEffect(() => {
    onContinueRef.current = onContinue;
  }, [onContinue]);

  useEffect(() => {
    if (!keyboardShortcutEnabled) return;

    let shortcutReady = false;
    const shortcutTimer = window.setTimeout(() => {
      shortcutReady = true;
    }, KEYBOARD_SHORTCUT_DELAY);

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
      window.clearTimeout(shortcutTimer);
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
        {wordCompletion ? (
          <div
            role="status"
            className={`flex items-start gap-2 border-l-4 px-3 py-2 ${
              wordCompletion === 'recovered'
                ? 'border-danger bg-danger/10'
                : 'border-success bg-success/10'
            }`}
          >
            {wordCompletion === 'clean' ? (
              <CheckCircleIcon
                className={`mt-0.5 size-5 shrink-0 ${completionStyles.text}`}
                aria-hidden="true"
              />
            ) : (
              <ExclamationCircleIcon
                className={`mt-0.5 size-5 shrink-0 ${completionStyles.text}`}
                aria-hidden="true"
              />
            )}
            <div>
              <p className={`font-semibold ${completionStyles.text}`}>
                {wordCompletion === 'clean' ? 'Word complete' : 'Word complete - keep practicing'}
              </p>
              <p className="text-sm text-foreground/80">
                {wordCompletion === 'clean'
                  ? 'You passed both directions with no misses.'
                  : 'You passed both directions, but missed this word earlier.'}
              </p>
            </div>
          </div>
        ) : null}
        <div className="divide-y divide-default-200 border-y border-default-200">
          {feedback.quizItem.hint ? (
            <AnswerRow label="Hint" value={feedback.quizItem.hint} />
          ) : null}
          <AnswerRow label="Your answer" value={feedback.submittedAnswer.trim() || 'No answer'} />
          <AnswerRow
            label={languageLabels.correctAnswerRowLabel}
            value={feedback.quizItem.answer}
          />
        </div>
      </div>

      <footer className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
      </footer>
    </section>
  );
}
