import LearnPage from '@/app/(protected)/decks/[deckId]/learn/learn-page';
import { getNewVocabsForDeckAction } from '@/server/review.actions';

type Props = {
  params: Promise<{
    deckId: string;
  }>;
};

export default async function Page({ params }: Props) {
  const { deckId } = await params;
  const learnItems = await getNewVocabsForDeckAction(Number(deckId), 5);

  return <LearnPage deckId={Number(deckId)} learnItems={learnItems} />;
}
