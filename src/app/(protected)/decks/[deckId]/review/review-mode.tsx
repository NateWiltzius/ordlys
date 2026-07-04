'use client';

import QuizMode from '@/components/shared/quiz/quiz-mode';
import { reviewVocabAction } from '@/server/review.actions';
import { ReviewItem } from '@/types/review.types';
import { Button, Card } from '@heroui/react';
import Link from 'next/link';

export default function ReviewMode({ dueReviews }: { dueReviews: ReviewItem[] }) {
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
            <Link href="/dashboard">
              <Button variant="primary">Back to dashboard</Button>
            </Link>
          </Card.Footer>
        </Card>
      </div>
    );
  }

  return (
    <QuizMode
      quizItems={dueReviews}
      onVocabComplete={async (vocabId, wasCorrect) => {
        await reviewVocabAction(vocabId, wasCorrect);
      }}
    />
  );
}
