import { getCachedLessonProgress } from '@/app/(protected)/decks/[deckId]/_lib/get-cached-lesson-progress';
import LessonsAccordion from '@/app/(protected)/decks/[deckId]/_components/lessons-accordion';
import EmptyState from '@/components/shared/empty-state';
import { Card } from '@heroui/react';

type Props = {
  deckId: number;
  userId: string;
  canStudy: boolean;
};

export default async function DeckLessons({ deckId, userId, canStudy }: Props) {
  const lessonProgress = await getCachedLessonProgress(deckId, userId);

  return (
    <Card>
      <Card.Header>
        <Card.Title>Lessons</Card.Title>
        <Card.Description>The lessons included in this deck.</Card.Description>
      </Card.Header>
      <Card.Content>
        {lessonProgress.length === 0 ? (
          <EmptyState title="No lessons yet" />
        ) : (
          <LessonsAccordion deckId={deckId} lessons={lessonProgress} canStudy={canStudy} />
        )}
      </Card.Content>
    </Card>
  );
}
