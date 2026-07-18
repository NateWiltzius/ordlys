'use client';

import QuizAnswerForm from '@/components/quiz/quiz-answer-form';
import QuizFeedbackPanel from '@/components/quiz/quiz-feedback-panel';
import { normalizeAnswer } from '@/lib/quiz/normalize';
import type { QuizFeedback, QuizQueueItem } from '@/types/quiz.types';
import { useState } from 'react';

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
  const [itemIndex, setItemIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<QuizFeedback | null>(null);
  const quizItem = PREVIEW_ITEMS[itemIndex];
  const reservedFeedback: QuizFeedback = feedback ?? {
    quizItem,
    submittedAnswer: quizItem.answer,
    isCorrect: true,
  };

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
    setItemIndex(index => (index + 1) % PREVIEW_ITEMS.length);
    setAnswer('');
    setFeedback(null);
  };

  return (
    <section className="w-full space-y-3" aria-label="Interactive Norwegian quiz preview">
      <div className="flex items-center justify-between gap-3 px-1 text-sm">
        <p className="font-semibold">Norwegian A1</p>
        <p className="text-default-500">Interactive study preview</p>
      </div>

      <div className="grid">
        <div
          className={`col-start-1 row-start-1 ${feedback ? 'invisible pointer-events-none' : ''}`}
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
          className={`col-start-1 row-start-1 ${feedback ? '' : 'invisible pointer-events-none'}`}
          aria-hidden={feedback ? undefined : true}
        >
          <QuizFeedbackPanel
            feedback={reservedFeedback}
            keyboardShortcutEnabled={feedback !== null}
            onContinue={continuePreview}
          />
        </div>
      </div>
    </section>
  );
}
