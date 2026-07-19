'use client';

import QuizMode from '@/app/(protected)/decks/[deckId]/_components/quiz/quiz-mode';
import { ReviewItem } from '@/types/review.types';
import { Card } from '@heroui/react';
import ButtonLink from '@/components/shared/button-link';
import { STUDY_TONE_STYLES } from '@/lib/study-colors';
import StudySession from '@/components/shared/layout/study-session';
import NextReviewText from '@/components/shared/next-review-text';
import type { NextReviewBatch } from '@/types/review.types';
import SessionSizePicker from '@/components/shared/session-size-picker';
import { REVIEW_SESSION_SIZES } from '@/lib/study-session-size';
import { useState } from 'react';

type Props = {
  deckId: number;
  dueReviews: ReviewItem[];
  nextReview: NextReviewBatch | null;
  selectedSize: number | 'all';
  availableCount: number;
};

export default function ReviewMode({
  deckId,
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
            <ButtonLink href={`/decks/${deckId}`}>Back to deck</ButtonLink>
          </Card.Footer>
        </Card>
      </StudySession>
    );
  }

  return (
    <StudySession className="space-y-6">
      <h1 className={`text-2xl font-semibold ${STUDY_TONE_STYLES.review.text}`}>
        Review due cards
      </h1>
      {!hasStarted ? (
        <SessionSizePicker
          baseHref={`/decks/${deckId}/review`}
          selectedSize={selectedSize}
          sizes={REVIEW_SESSION_SIZES}
          totalCount={availableCount}
          noun="card"
          allowAll
        />
      ) : null}
      <QuizMode
        key={selectedSize}
        quizItems={dueReviews}
        tone="review"
        studyMode="review"
        completionHref={`/decks/${deckId}`}
        onSessionStart={() => setHasStarted(true)}
      />
    </StudySession>
  );
}
