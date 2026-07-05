'use client';

import QuizMode from '@/app/(protected)/decks/[deckId]/_components/quiz/quiz-mode';
import { PLACEMENT_TEST_CONFIG } from '@/lib/srs/srs-config';
import { placeVocabAction } from '@/server/review.actions';
import { PlacementTestItem } from '@/types/review.types';
import { Card } from '@heroui/react';

type Props = {
  deckId: number;
  placementItems: PlacementTestItem[];
};

export default function PlacementTestMode({ deckId, placementItems }: Props) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card variant="tertiary">
        <Card.Header>
          <Card.Title>Placement test: {placementItems[0].lessonTitle}</Card.Title>
          <Card.Description>
            Pass each word in both directions without a mistake to place it directly at Strong (SRS
            level {PLACEMENT_TEST_CONFIG.passedSrsLevel}). Missed words will start in normal
            learning, and existing progress will not be reduced.
          </Card.Description>
        </Card.Header>
      </Card>

      <QuizMode
        quizItems={placementItems}
        completionHref={`/decks/${deckId}`}
        onVocabComplete={async (vocabId, wasCorrect) => {
          return await placeVocabAction(vocabId, wasCorrect);
        }}
      />
    </div>
  );
}
