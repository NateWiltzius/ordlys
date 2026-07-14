'use client';

import QuizMode from '@/app/(protected)/decks/[deckId]/_components/quiz/quiz-mode';
import SessionSizePicker from '@/components/shared/session-size-picker';
import ButtonLink from '@/components/shared/button-link';
import StudySession from '@/components/shared/layout/study-session';
import NextReviewText from '@/components/shared/next-review-text';
import { REVIEW_SESSION_SIZES } from '@/lib/study-session-size';
import { reviewVocabAction } from '@/server/review.actions';
import type { NextReviewBatch, ReviewItem } from '@/types/review.types';
import { Card } from '@heroui/react';

type Props = {
  dueReviews: ReviewItem[];
  totalDueReviews: number;
  selectedSize: number | 'all';
  nextReview: NextReviewBatch | null;
};

export default function AllDecksReviewMode({
  dueReviews,
  totalDueReviews,
  selectedSize,
  nextReview,
}: Props) {
  if (dueReviews.length === 0) {
    return (
      <StudySession>
        <Card>
          <Card.Header>
            <Card.Title>No reviews due</Card.Title>
            <Card.Description>
              <NextReviewText nextReview={nextReview} />
            </Card.Description>
          </Card.Header>
          <Card.Footer>
            <ButtonLink href="/dashboard">Back to dashboard</ButtonLink>
          </Card.Footer>
        </Card>
      </StudySession>
    );
  }

  return (
    <StudySession className="space-y-6">
      <h1 className="text-2xl font-semibold text-success">Review due cards</h1>
      <SessionSizePicker
        baseHref="/review"
        selectedSize={selectedSize}
        sizes={REVIEW_SESSION_SIZES}
        totalCount={totalDueReviews}
        noun="review"
        allowAll
      />
      <QuizMode
        quizItems={dueReviews}
        tone="review"
        studyMode="review"
        completionHref="/dashboard"
        onVocabComplete={async (vocabId, wasCorrect) => {
          return await reviewVocabAction(vocabId, wasCorrect);
        }}
      />
    </StudySession>
  );
}
