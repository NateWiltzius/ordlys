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
import { REVIEW_SESSION_SIZE_COOKIE, REVIEW_SESSION_SIZES } from '@/lib/study-session-size';
import { useState } from 'react';

type Props = {
  deckId: number;
  deckTitle: string;
  dueReviews: ReviewItem[];
  nextReview: NextReviewBatch | null;
  selectedSize: number | 'all';
  availableCount: number;
};

export default function ReviewMode({
  deckId,
  deckTitle,
  dueReviews,
  nextReview,
  selectedSize,
  availableCount: initialAvailableCount,
}: Props) {
  // Server actions revalidate this route after every answer. Keep the batch that
  // started this client session so the final revalidation cannot hide its summary.
  const [startedSession, setStartedSession] = useState<{
    dueReviews: ReviewItem[];
    nextReview: NextReviewBatch | null;
    availableCount: number;
  } | null>(null);
  const session = startedSession ?? {
    dueReviews,
    nextReview,
    availableCount: initialAvailableCount,
  };
  const hasStarted = startedSession !== null;
  const availableCount = session.availableCount;

  if (session.dueReviews.length === 0) {
    return (
      <StudySession>
        <Card>
          <Card.Header>
            <Card.Title render={props => <h1 {...props} />}>No reviews due</Card.Title>
            <Card.Description>
              <span className="block">{deckTitle}</span>
              <NextReviewText nextReview={session.nextReview} />
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
      <header>
        <h1 className={`text-2xl font-semibold ${STUDY_TONE_STYLES.review.text}`}>
          Review due cards
        </h1>
        <p className="mt-1 text-sm text-default-500">
          {deckTitle} · {availableCount} {availableCount === 1 ? 'review' : 'reviews'} due
        </p>
      </header>
      {!hasStarted ? (
        <SessionSizePicker
          baseHref={`/decks/${deckId}/review`}
          selectedSize={selectedSize}
          sizes={REVIEW_SESSION_SIZES}
          totalCount={session.availableCount}
          noun="card"
          allowAll
          showDurationEstimate
          preferenceCookieName={REVIEW_SESSION_SIZE_COOKIE}
        />
      ) : null}
      <QuizMode
        key={selectedSize}
        quizItems={session.dueReviews}
        tone="review"
        studyMode="review"
        completionHref={`/decks/${deckId}`}
        reviewDeckId={deckId}
        onSessionStart={() => setStartedSession(current => current ?? session)}
      />
    </StudySession>
  );
}
