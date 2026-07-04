import LearnPage from '@/app/(protected)/decks/[deckId]/learn/learn-page';
import { getLessonProgressForDeckAction, getNewVocabsForDeckAction } from '@/server/review.actions';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{
    deckId: string;
  }>;
};

export default async function Page({ params }: Props) {
  const { deckId } = await params;
  const parsedDeckId = parsePositiveInteger(deckId);
  if (!parsedDeckId) notFound();

  const [learnItems, lessonProgress] = await Promise.all([
    getNewVocabsForDeckAction(parsedDeckId, 5),
    getLessonProgressForDeckAction(parsedDeckId),
  ]);

  return (
    <LearnPage deckId={parsedDeckId} learnItems={learnItems} lessonProgress={lessonProgress} />
  );
}
