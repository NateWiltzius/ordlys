'use client';

import QuizAnswerForm from '@/components/quiz/quiz-answer-form';
import QuizFeedbackPanel from '@/components/quiz/quiz-feedback-panel';
import ButtonLink from '@/components/shared/button-link';
import { useAuthSessionState } from '@/hooks/use-auth-session-state';
import { normalizeAnswer } from '@/lib/quiz/normalize';
import type { QuizFeedback, QuizQueueItem } from '@/types/quiz.types';
import { useEffect, useRef, useState } from 'react';

const SCROLL_RESTORE_DELAY = 100;

const PREVIEW_ITEMS: QuizQueueItem[] = [
  {
    cardId: 1,
    direction: 'ftb',
    prompt: 'å huske',
    hint: null,
    answer: 'to remember',
    acceptedAnswers: ['to remember', 'remember'],
    frontLanguage: 'nb',
    backLanguage: 'en',
  },
  {
    cardId: 2,
    direction: 'ftb',
    prompt: 'et språk',
    hint: null,
    answer: 'a language',
    acceptedAnswers: ['a language', 'language'],
    frontLanguage: 'nb',
    backLanguage: 'en',
  },
  {
    cardId: 3,
    direction: 'ftb',
    prompt: 'å lære',
    hint: null,
    answer: 'to learn',
    acceptedAnswers: ['to learn', 'learn'],
    frontLanguage: 'nb',
    backLanguage: 'en',
  },
];

export default function HomepageQuizPreview() {
  const loggedIn = useAuthSessionState();
  const [itemIndex, setItemIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<QuizFeedback | null>(null);
  const scrollRestoreTimerRef = useRef<number | null>(null);
  const previousOverflowAnchorRef = useRef<string | null>(null);
  const quizItem = PREVIEW_ITEMS[itemIndex];
  const reservedFeedback: QuizFeedback = feedback ?? {
    quizItem,
    submittedAnswer: quizItem.answer,
    isCorrect: true,
  };

  useEffect(() => {
    return () => {
      if (scrollRestoreTimerRef.current !== null) {
        window.clearTimeout(scrollRestoreTimerRef.current);
      }
      if (previousOverflowAnchorRef.current !== null) {
        document.documentElement.style.overflowAnchor = previousOverflowAnchorRef.current;
      }
    };
  }, []);

  const submitAnswer = () => {
    const normalizedAnswer = normalizeAnswer(answer);
    setFeedback({
      quizItem,
      submittedAnswer: answer,
      isCorrect: quizItem.acceptedAnswers.some(
        acceptedAnswer => normalizeAnswer(acceptedAnswer) === normalizedAnswer,
      ),
    });
  };

  const continuePreview = () => {
    const previousScrollY = window.scrollY;
    const root = document.documentElement;
    const previousOverflowAnchor = root.style.overflowAnchor;
    previousOverflowAnchorRef.current = previousOverflowAnchor;
    root.style.overflowAnchor = 'none';

    setItemIndex(index => (index + 1) % PREVIEW_ITEMS.length);
    setAnswer('');
    setFeedback(null);

    if (scrollRestoreTimerRef.current !== null) {
      window.clearTimeout(scrollRestoreTimerRef.current);
    }
    scrollRestoreTimerRef.current = window.setTimeout(() => {
      root.style.overflowAnchor = previousOverflowAnchor;
      window.scrollTo({ top: previousScrollY, behavior: 'auto' });
      scrollRestoreTimerRef.current = null;
      previousOverflowAnchorRef.current = null;
    }, SCROLL_RESTORE_DELAY);
  };

  return (
    <section
      className="w-full rounded-lg border border-default-200 bg-default-50 p-4 sm:p-5"
      aria-label="Interactive Norwegian quiz preview"
    >
      <div className="flex items-center justify-between gap-3 border-b border-default-200 pb-4 text-sm">
        <div>
          <p className="font-semibold">Norwegian example</p>
          <p className="mt-1 text-default-500">One word from the A1 deck</p>
        </div>
        <p className="text-default-500">Interactive preview</p>
      </div>

      <div className="grid pt-4">
        <div
          className={`col-start-1 row-start-1 ${feedback ? 'hidden' : ''}`}
          aria-hidden={feedback ? true : undefined}
        >
          <QuizAnswerForm
            prompt={quizItem.prompt}
            hint={quizItem.hint}
            answer={answer}
            direction={quizItem.direction}
            frontLanguage={quizItem.frontLanguage}
            backLanguage={quizItem.backLanguage}
            tone="learning"
            autoFocus={false}
            keepAboveKeyboard={false}
            onAnswerChange={setAnswer}
            onSubmit={submitAnswer}
          />
        </div>

        <div
          className={`col-start-1 row-start-1 ${feedback ? '' : 'hidden'}`}
          aria-hidden={feedback ? undefined : true}
        >
          <QuizFeedbackPanel
            feedback={reservedFeedback}
            studyMode="learn"
            keyboardShortcutEnabled={feedback !== null}
            recordAttempts={false}
            onContinue={continuePreview}
          />
        </div>
      </div>

      {feedback ? (
        <div className="mt-4 flex flex-col gap-4 border-t border-default-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-sm leading-6 text-default-500">
            This preview is not saved. Use the same study flow with cards you create or follow.
          </p>
          <ButtonLink
            href={loggedIn ? '/decks' : '/auth/sign-up?next=%2Fdecks'}
            className="shrink-0"
          >
            {loggedIn ? 'Open your library' : 'Create a deck'}
          </ButtonLink>
        </div>
      ) : null}
    </section>
  );
}
