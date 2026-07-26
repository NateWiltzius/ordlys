import { getCachedLessonProgress } from '@/app/(protected)/decks/[deckId]/_lib/get-cached-lesson-progress';
import LessonsAccordion from '@/app/(protected)/decks/[deckId]/_components/lessons-accordion';
import LessonsSection from '@/app/(protected)/decks/[deckId]/_components/lessons-section';
import EmptyState from '@/components/shared/empty-state';
import { getCachedDeckStudyData } from '@/app/(protected)/decks/[deckId]/_lib/get-cached-deck-study-data';

type Props = {
  deckId: number;
  frontLabel: string;
  backLabel: string;
};

export default async function DeckLessons({ deckId, frontLabel, backLabel }: Props) {
  const [lessonProgress, studyData] = await Promise.all([
    getCachedLessonProgress(deckId),
    getCachedDeckStudyData(deckId),
  ]);

  return (
    <LessonsSection lessonCount={lessonProgress.length}>
      {lessonProgress.length === 0 ? (
        <EmptyState title="No lessons yet" />
      ) : (
        <LessonsAccordion
          deckId={deckId}
          lessons={lessonProgress}
          canStudy={studyData.canStudy}
          frontLabel={frontLabel}
          backLabel={backLabel}
        />
      )}
    </LessonsSection>
  );
}
