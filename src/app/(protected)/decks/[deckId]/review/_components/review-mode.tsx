'use client';

import QuizMode from '@/app/(protected)/decks/[deckId]/_components/quiz/quiz-mode';
import { reviewVocabAction } from '@/server/review.actions';
import { ReviewItem } from '@/types/review.types';
import { Card } from '@heroui/react';
import ButtonLink from '@/components/shared/button-link';

type Props = {
  deckId: number;
  dueReviews: ReviewItem[];
};

export default function ReviewMode({ deckId, dueReviews }: Props) {
  if (dueReviews.length === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <Card.Header>
            <Card.Title>No reviews due</Card.Title>
            <Card.Description>
              You are caught up for now. Come back later or learn new words.
            </Card.Description>
          </Card.Header>
          <Card.Footer>
            <ButtonLink href={`/decks/${deckId}`}>Back to deck</ButtonLink>
          </Card.Footer>
        </Card>
      </div>
    );
  }

  return (
    <QuizMode
      quizItems={dueReviews}
      completionHref={`/decks/${deckId}`}
      onVocabComplete={async (vocabId, wasCorrect) => {
        return await reviewVocabAction(vocabId, wasCorrect);
      }}
    />
  );
}
