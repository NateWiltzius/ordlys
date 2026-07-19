import QuizMode from '@/app/(protected)/decks/[deckId]/_components/quiz/quiz-mode';
import SemanticCardTitle from '@/components/shared/semantic-card-title';
import StudySession from '@/components/shared/layout/study-session';
import { PlacementTestItem } from '@/types/review.types';
import { Card } from '@heroui/react';

type Props = {
  deckId: number;
  placementItems: PlacementTestItem[];
};

export default function PlacementTestMode({ deckId, placementItems }: Props) {
  return (
    <StudySession className="space-y-6">
      <Card variant="tertiary">
        <Card.Header>
          <SemanticCardTitle level={1}>
            Placement test: {placementItems[0].lessonTitle}
          </SemanticCardTitle>
          <Card.Description>
            Pass each word in both directions without a mistake to mark its memory strength as
            Strong, where it counts as learned. Missed words remain Not started and will appear in
            the normal learning flow. Existing progress will not be reduced.
          </Card.Description>
        </Card.Header>
      </Card>

      <QuizMode
        quizItems={placementItems}
        studyMode="placement"
        completionHref={`/decks/${deckId}`}
        allowAnswerOverride={false}
      />
    </StudySession>
  );
}
