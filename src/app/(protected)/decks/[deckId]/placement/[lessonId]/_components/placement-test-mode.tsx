import QuizMode from '@/app/(protected)/decks/[deckId]/_components/quiz/quiz-mode';
import SemanticCardTitle from '@/components/shared/semantic-card-title';
import StudySession from '@/components/shared/layout/study-session';
import StudySessionHeader from '@/components/shared/layout/study-session-header';
import { PlacementTestItem } from '@/types/review.types';
import { Card } from '@heroui/react';

type Props = {
  deckId: number;
  placementItems: PlacementTestItem[];
};

export default function PlacementTestMode({ deckId, placementItems }: Props) {
  return (
    <StudySession>
      <StudySessionHeader
        title="Test out of this lesson"
        description={`${placementItems[0].lessonTitle} · ${placementItems.length} ${
          placementItems.length === 1 ? 'word' : 'words'
        }`}
        tone="neutral"
        exitHref={`/decks/${deckId}`}
        exitLabel="Exit to deck"
      />
      <Card variant="tertiary">
        <Card.Header>
          <SemanticCardTitle level={2}>How placement works</SemanticCardTitle>
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
        reviewDeckId={deckId}
        allowAnswerOverride={false}
        showExitButton={false}
      />
    </StudySession>
  );
}
