import { getCachedLessonProgress } from '@/app/(protected)/decks/[deckId]/_lib/get-cached-lesson-progress';
import LessonsAccordion from '@/app/(protected)/decks/[deckId]/_components/lessons-accordion';
import LessonsSection from '@/app/(protected)/decks/[deckId]/_components/lessons-section';
import EmptyState from '@/components/shared/empty-state';

type Props = {
  deckId: number;
  canStudy: boolean;
};

export default async function DeckLessons({ deckId, canStudy }: Props) {
  const lessonProgress = await getCachedLessonProgress(deckId);

  return (
    <LessonsSection lessonCount={lessonProgress.length}>
      {lessonProgress.length === 0 ? (
        <EmptyState title="No lessons yet" />
      ) : (
        <LessonsAccordion deckId={deckId} lessons={lessonProgress} canStudy={canStudy} />
      )}
    </LessonsSection>
  );
}
