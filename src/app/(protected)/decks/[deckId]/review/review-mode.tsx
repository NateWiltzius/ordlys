'use client';

import QuizMode from '@/components/shared/quiz/quiz-mode';
import { reviewVocabAction } from '@/server/review.actions';
import { ReviewItem } from '@/types/review.types';

export default function ReviewMode({ dueReviews }: { dueReviews: ReviewItem[] }) {
  return (
    <div>
      <QuizMode
        quizItems={dueReviews}
        onVocabComplete={async (vocabId, wasCorrect) => {
          await reviewVocabAction(vocabId, wasCorrect);
        }}
      />
    </div>
  );
}
