'use client';

import { Button, Input } from '@heroui/react';
import { FormEvent, KeyboardEvent, useLayoutEffect, useRef } from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { STUDY_TONE_STYLES, StudyTone } from '@/lib/study-colors';
import { useKeepAboveKeyboard } from '@/hooks/use-keep-above-keyboard';
import { getQuizLanguageLabels } from '@/lib/quiz/quiz-language-labels';
import { getStudyTextSizeClass } from '@/lib/study-text-size';

type Props = {
  prompt: string;
  hint: string | null;
  answer: string;
  direction: 'btf' | 'ftb';
  frontLanguage: string | null;
  backLanguage: string | null;
  tone: StudyTone;
  autoFocus?: boolean;
  keepAboveKeyboard?: boolean;
  onAnswerChange: (answer: string) => void;
  onSubmit: () => void;
  onGiveUp?: () => void;
  deckTitle?: string | null;
  lessonTitle?: string | null;
};

export default function QuizAnswerForm({
  prompt,
  hint,
  answer,
  direction,
  frontLanguage,
  backLanguage,
  tone,
  autoFocus = true,
  keepAboveKeyboard = true,
  onAnswerChange,
  onSubmit,
  onGiveUp,
  deckTitle,
  lessonTitle,
}: Props) {
  const answerInputRef = useRef<HTMLInputElement>(null);
  const answerCardRef = useRef<HTMLElement>(null);
  const shownLanguageCode = direction === 'btf' ? backLanguage : frontLanguage;
  const answerLanguageCode = direction === 'btf' ? frontLanguage : backLanguage;
  const { promptLabel, answerLabel, answerInstruction } = getQuizLanguageLabels(
    direction,
    frontLanguage,
    backLanguage,
  );
  const hasAnswer = answer.trim().length > 0;
  useKeepAboveKeyboard(answerInputRef, answerCardRef, keepAboveKeyboard, `${direction}:${prompt}`);

  useLayoutEffect(() => {
    if (!autoFocus) return;

    answerInputRef.current?.focus({ preventScroll: true });
  }, [autoFocus, direction, prompt]);

  const submitAnswer = () => {
    if (!hasAnswer) {
      answerInputRef.current?.focus();
      return;
    }
    onSubmit();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitAnswer();
  };

  const handleAnswerKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' || event.repeat || event.nativeEvent.isComposing) return;

    event.preventDefault();
    submitAnswer();
  };

  return (
    <section
      ref={answerCardRef}
      data-study-tone={tone}
      className="quiz-answer-card w-full py-4 sm:py-6"
    >
      <form onSubmit={handleSubmit}>
        <div className="quiz-answer-content">
          <div
            role="note"
            className="border-b border-default-200 pb-6"
            aria-label={`${promptLabel} shown; ${answerInstruction.toLowerCase()}`}
          >
            {deckTitle || lessonTitle ? (
              <p className="mb-3 truncate text-center text-xs font-medium text-default-500">
                {[deckTitle, lessonTitle].filter(Boolean).join(' · ')}
              </p>
            ) : null}
            <div className="quiz-answer-direction flex items-center justify-center gap-2 text-xs text-default-500 sm:text-sm">
              <strong className="font-medium text-default-700">{promptLabel}</strong>
              <ArrowRightIcon
                className={`size-4 shrink-0 ${STUDY_TONE_STYLES[tone].text}`}
                aria-hidden="true"
              />
              <strong className={`font-medium ${STUDY_TONE_STYLES[tone].text}`}>
                {answerLabel}
              </strong>
            </div>
            <p
              className={`quiz-answer-prompt break-words py-8 text-center sm:py-10 ${getStudyTextSizeClass(
                prompt,
              )}`}
              lang={shownLanguageCode ?? undefined}
            >
              {prompt}
            </p>
            {hint ? (
              <p className="text-center text-sm text-default-500">
                <span className="font-semibold text-default-700">Hint:</span> {hint}
              </p>
            ) : null}
          </div>

          <div className="mt-6 space-y-2 rounded-xl bg-default-50 p-4">
            <p className="text-sm font-medium">{answerInstruction}</p>
            <Input
              ref={answerInputRef}
              aria-label={answerInstruction}
              value={answer}
              onChange={e => onAnswerChange(e.target.value)}
              onKeyDown={handleAnswerKeyDown}
              placeholder="Your answer"
              required
              fullWidth
              lang={answerLanguageCode ?? undefined}
              autoComplete="off"
            />
          </div>
        </div>

        <div className="quiz-answer-footer mt-5 flex flex-col gap-3 border-t border-default-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="hidden text-xs text-default-500 sm:block">
            Press <kbd className="rounded border border-default-300 px-1.5 py-0.5">Enter</kbd> to
            submit
          </p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            {onGiveUp ? (
              <Button
                type="button"
                variant="secondary"
                className="w-full sm:w-auto"
                onPress={onGiveUp}
              >
                I don&apos;t know
              </Button>
            ) : null}
            <Button
              type="submit"
              variant="primary"
              isDisabled={!hasAnswer}
              className={`w-full sm:w-auto ${STUDY_TONE_STYLES[tone].button}`}
            >
              Submit answer
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}
