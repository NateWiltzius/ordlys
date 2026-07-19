'use client';

import { Button, Card, Input } from '@heroui/react';
import { FormEvent, KeyboardEvent, useRef } from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { STUDY_TONE_STYLES, StudyTone } from '@/lib/study-colors';
import { useKeepAboveKeyboard } from '@/hooks/use-keep-above-keyboard';
import { getQuizLanguageLabels } from '@/lib/quiz/quiz-language-labels';

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
}: Props) {
  const answerInputRef = useRef<HTMLInputElement>(null);
  const answerCardRef = useRef<HTMLDivElement>(null);
  const shownLanguageCode = direction === 'btf' ? backLanguage : frontLanguage;
  const answerLanguageCode = direction === 'btf' ? frontLanguage : backLanguage;
  const { promptLabel, answerLabel, answerInstruction } = getQuizLanguageLabels(
    direction,
    frontLanguage,
    backLanguage,
  );
  const hasAnswer = answer.trim().length > 0;
  useKeepAboveKeyboard(answerInputRef, answerCardRef, keepAboveKeyboard);

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
    <Card ref={answerCardRef} variant="secondary" className="quiz-answer-card w-full">
      <form onSubmit={handleSubmit}>
        <Card.Content className="quiz-answer-content space-y-4">
          <div
            className="overflow-hidden rounded-lg border border-default-200 bg-default-100"
            role="note"
            aria-label={`${promptLabel} shown; ${answerInstruction.toLowerCase()}`}
          >
            <div
              className={`flex items-center justify-center gap-3 border-b px-3 py-2 ${STUDY_TONE_STYLES[tone].surface}`}
            >
              <p className="min-w-0 flex-1 text-center text-xs sm:text-sm">
                <span className="text-default-500">Shown: </span>
                <strong className="font-semibold text-default-900">{promptLabel}</strong>
              </p>
              <ArrowRightIcon
                className={`size-4 shrink-0 ${STUDY_TONE_STYLES[tone].text}`}
                aria-hidden="true"
              />
              <p
                className={`min-w-0 flex-1 text-center text-xs sm:text-sm ${STUDY_TONE_STYLES[tone].text}`}
              >
                <span>Type: </span>
                <strong className="font-bold">{answerLabel}</strong>
              </p>
            </div>
            <p
              className="quiz-answer-prompt break-words px-4 py-6 text-center text-2xl font-semibold"
              lang={shownLanguageCode ?? undefined}
            >
              {prompt}
            </p>
            {hint ? (
              <p className="border-t border-default-200 px-4 py-3 text-center text-sm text-default-600">
                <span className="font-semibold text-default-700">Hint:</span> {hint}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">{answerInstruction}</p>
            <Input
              ref={answerInputRef}
              aria-label={answerInstruction}
              value={answer}
              onChange={e => onAnswerChange(e.target.value)}
              onKeyDown={handleAnswerKeyDown}
              placeholder="Your answer"
              autoFocus={autoFocus}
              required
              fullWidth
              lang={answerLanguageCode ?? undefined}
              autoComplete="off"
            />
          </div>
        </Card.Content>

        <Card.Footer className="quiz-answer-footer">
          <Button
            type="submit"
            variant="primary"
            isDisabled={!hasAnswer}
            className={`mt-4 w-full sm:w-auto ${STUDY_TONE_STYLES[tone].button}`}
          >
            Submit answer
          </Button>
        </Card.Footer>
      </form>
    </Card>
  );
}
