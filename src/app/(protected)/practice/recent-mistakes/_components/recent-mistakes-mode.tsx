import QuizMode from '@/app/(protected)/decks/[deckId]/_components/quiz/quiz-mode';
import type { QuizSourceItem } from '@/types/quiz.types';

type Props = {
  quizItems: QuizSourceItem[];
};

export default function RecentMistakesMode({ quizItems }: Props) {
  return (
    <QuizMode
      quizItems={quizItems}
      studyMode="review"
      tone="practice"
      recordAttempts={false}
      completionHref="/dashboard"
    />
  );
}
