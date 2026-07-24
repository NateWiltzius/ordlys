'use client';

import QuizMode from '@/app/(protected)/decks/[deckId]/_components/quiz/quiz-mode';
import ButtonLink from '@/components/shared/button-link';
import StudySession from '@/components/shared/layout/study-session';
import StudySessionHeader from '@/components/shared/layout/study-session-header';
import NextReviewText from '@/components/shared/next-review-text';
import type { NextReviewBatch, ReviewDeckDueCount, ReviewItem } from '@/types/review.types';
import { Card } from '@heroui/react';
import SessionSizePicker from '@/components/shared/session-size-picker';
import { REVIEW_SESSION_SIZE_COOKIE, REVIEW_SESSION_SIZES } from '@/lib/study-session-size';
import { useState } from 'react';
import ReviewDeckBreakdown from '@/components/shared/review-deck-breakdown';

type Props = {
  dueReviews: ReviewItem[];
  nextReview: NextReviewBatch | null;
  selectedSize: number | 'all';
  availableCount: number;
  deckBreakdown: ReviewDeckDueCount[];
};

export default function AllDecksReviewMode({
  dueReviews,
  nextReview,
  selectedSize,
  availableCount: initialAvailableCount,
  deckBreakdown,
}: Props) {
  // Server actions revalidate this route after every answer. Keep the batch that
  // started this client session so the final revalidation cannot hide its summary.
  const [startedSession, setStartedSession] = useState<{
    dueReviews: ReviewItem[];
    nextReview: NextReviewBatch | null;
    availableCount: number;
    deckBreakdown: ReviewDeckDueCount[];
  } | null>(null);
  const session = startedSession ?? {
    dueReviews,
    nextReview,
    availableCount: initialAvailableCount,
    deckBreakdown,
  };
  const hasStarted = startedSession !== null;
  const availableCount = session.availableCount;

  if (session.dueReviews.length === 0) {
    return (
      <StudySession>
        <StudySessionHeader
          title="Review due cards"
          description="Across your active decks"
          tone="review"
          exitHref="/dashboard"
          exitLabel="Exit to Today"
        />
        <Card>
          <Card.Header>
            <Card.Title render={props => <h2 {...props} />}>No reviews due</Card.Title>
            <Card.Description>
              <NextReviewText nextReview={session.nextReview} />
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
    <StudySession>
      <StudySessionHeader
        title="Review due cards"
        description={`Across your active decks · ${availableCount} ${
          availableCount === 1 ? 'review' : 'reviews'
        } due`}
        tone="review"
        exitHref="/dashboard"
        exitLabel="Exit to Today"
      />
      {!hasStarted ? (
        <>
          <SessionSizePicker
            baseHref="/review"
            selectedSize={selectedSize}
            sizes={REVIEW_SESSION_SIZES}
            totalCount={session.availableCount}
            noun="review"
            allowAll
            preferenceCookieName={REVIEW_SESSION_SIZE_COOKIE}
          />
          <ReviewDeckBreakdown decks={session.deckBreakdown} />
        </>
      ) : null}
      <QuizMode
        key={selectedSize}
        quizItems={session.dueReviews}
        tone="review"
        studyMode="review"
        completionHref="/dashboard"
        showExitButton={false}
        onSessionStart={() => setStartedSession(current => current ?? session)}
      />
    </StudySession>
  );
}
