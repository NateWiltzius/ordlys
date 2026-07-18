'use client';

import QuizMode from '@/app/(protected)/decks/[deckId]/_components/quiz/quiz-mode';
import ButtonLink from '@/components/shared/button-link';
import StudySession from '@/components/shared/layout/study-session';
import NextReviewText from '@/components/shared/next-review-text';
import type { NextReviewBatch, ReviewItem } from '@/types/review.types';
import { Card } from '@heroui/react';
import SessionSizePicker from '@/components/shared/session-size-picker';
import { REVIEW_SESSION_SIZES } from '@/lib/study-session-size';
import { useState } from 'react';

type Props = {
  dueReviews: ReviewItem[];
  nextReview: NextReviewBatch | null;
  selectedSize: number;
  availableCount: number;
};

export default function AllDecksReviewMode({
  dueReviews,
  nextReview,
  selectedSize,
  availableCount,
}: Props) {
  const [hasStarted, setHasStarted] = useState(false);

  if (dueReviews.length === 0) {
    return (
      <StudySession>
        <Card>
          <Card.Header>
            <Card.Title render={props => <h1 {...props} />}>No reviews due</Card.Title>
            <Card.Description>
              <NextReviewText nextReview={nextReview} />
            </Card.Description>
          </Card.Header>
          <Card.Footer>
            <ButtonLink href="/dashboard">Back to Today</ButtonLink>
          </Card.Footer>
        </Card>
      </StudySession>
    );
  }

  return (
    <StudySession className="space-y-6">
      <h1 className="text-2xl font-semibold text-success">Review due cards</h1>
      {!hasStarted ? (
        <SessionSizePicker
          baseHref="/review"
          selectedSize={selectedSize}
          sizes={REVIEW_SESSION_SIZES}
          totalCount={availableCount}
          noun="card"
        />
      ) : null}
      <QuizMode
        quizItems={dueReviews}
        tone="review"
        studyMode="review"
        completionHref="/dashboard"
        onSessionStart={() => setHasStarted(true)}
      />
    </StudySession>
  );
}
