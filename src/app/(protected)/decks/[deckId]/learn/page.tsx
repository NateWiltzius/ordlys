import LearnPage from '@/app/(protected)/decks/[deckId]/learn/_components/learn-page';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { notFound } from 'next/navigation';
import { getLearnPageDataAction } from '@/server/review.actions';

type Props = {
  params: Promise<{
    deckId: string;
  }>;
};

export default async function Page({ params }: Props) {
  const { deckId } = await params;
  const parsedDeckId = parsePositiveInteger(deckId);
  if (!parsedDeckId) notFound();
  const data = await getLearnPageDataAction(parsedDeckId);
  if (!data) notFound();
  const { learnItems, lessonProgress } = data;

  return (
    <LearnPage deckId={parsedDeckId} learnItems={learnItems} lessonProgress={lessonProgress} />
  );
}
