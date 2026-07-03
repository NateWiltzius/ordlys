'use client';

import LearnMode from '@/app/(protected)/decks/[deckId]/learn/learn-mode';
import QuizMode from '@/components/shared/quiz/quiz-mode';
import { startVocabAction } from '@/server/review.actions';
import { LearnItem } from '@/types/review.types';
import { useState } from 'react';

type Props = {
  deckId: number;
  learnItems: LearnItem[];
};

export default function LearnPage({ learnItems }: Props) {
  const [mode, setMode] = useState<'learn' | 'quiz'>('learn');

  const setModeHandler = (newMode: 'learn' | 'quiz') => {
    setMode(newMode);
  };

  return (
    <div>
      <h1>{mode === 'quiz' ? 'Quiz:' : 'Learning:'}</h1>
      {mode === 'learn' ? (
        <LearnMode learnItems={learnItems} setModeHandler={setModeHandler} />
      ) : (
        <QuizMode
          quizItems={learnItems}
          onVocabComplete={async vocabId => {
            await startVocabAction(vocabId);
          }}
        />
      )}
    </div>
  );
}
