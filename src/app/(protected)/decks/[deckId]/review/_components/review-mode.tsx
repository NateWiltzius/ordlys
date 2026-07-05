'use client';

import QuizMode from '@/app/(protected)/decks/[deckId]/_components/quiz/quiz-mode';
import { reviewVocabAction } from '@/server/review.actions';
import { ReviewItem } from '@/types/review.types';
import { Card } from '@heroui/react';
import ButtonLink from '@/components/shared/button-link';
import { STUDY_TONE_STYLES } from '@/lib/study-colors';
import StudySession from '@/components/shared/layout/study-session';

type Props = {
  deckId: number;
  dueReviews: ReviewItem[];
};

export default function ReviewMode({ deckId, dueReviews }: Props) {
  if (dueReviews.length === 0) {
    return (
      <StudySession>
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
      </StudySession>
    );
  }

  return (
    <StudySession className="space-y-6">
      <h1 className={`text-2xl font-semibold ${STUDY_TONE_STYLES.review.text}`}>
        Review due cards
      </h1>
      <QuizMode
        quizItems={dueReviews}
        tone="review"
        completionHref={`/decks/${deckId}`}
        onVocabComplete={async (vocabId, wasCorrect) => {
          return await reviewVocabAction(vocabId, wasCorrect, deckId);
        }}
      />
    </StudySession>
  );
}
