import LearnPage from '@/app/(protected)/decks/[deckId]/learn/_components/learn-page';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { notFound } from 'next/navigation';
import { getLearnPageDataAction } from '@/server/review.actions';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Learn',
  description: 'Learn new vocabulary and add it to your review queue.',
};

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
