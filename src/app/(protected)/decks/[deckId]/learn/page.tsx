import LearnPage from '@/app/(protected)/decks/[deckId]/learn/learn-page';
import { getNewVocabsForDeckAction } from '@/server/review.actions';
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

  const learnItems = await getNewVocabsForDeckAction(parsedDeckId, 5);

  return <LearnPage deckId={parsedDeckId} learnItems={learnItems} />;
}
