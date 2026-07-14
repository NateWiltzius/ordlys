'use client';

import QuizMode from '@/app/(protected)/decks/[deckId]/_components/quiz/quiz-mode';
import StudySession from '@/components/shared/layout/study-session';
import type { QuizSourceItem } from '@/types/quiz.types';

type Props = {
  quizItems: QuizSourceItem[];
};

export default function RecentMistakesMode({ quizItems }: Props) {
  return (
    <StudySession>
      <QuizMode
        quizItems={quizItems}
        studyMode="review"
        recordAttempts={false}
        completionHref="/dashboard"
        onVocabComplete={async () => ({ previousLevel: null, nextLevel: null })}
      />
    </StudySession>
  );
}
