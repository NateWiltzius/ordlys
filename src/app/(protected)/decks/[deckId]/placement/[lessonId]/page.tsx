import PlacementTestMode from '@/app/(protected)/decks/[deckId]/placement/[lessonId]/placement-test-mode';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { getPlacementTestVocabsAction } from '@/server/review.actions';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{
    deckId: string;
    lessonId: string;
  }>;
};

export default async function PlacementTestPage({ params }: Props) {
  const { deckId, lessonId } = await params;
  const parsedDeckId = parsePositiveInteger(deckId);
  const parsedLessonId = parsePositiveInteger(lessonId);

  if (!parsedDeckId || !parsedLessonId) notFound();

  const placementItems = await getPlacementTestVocabsAction(parsedDeckId, parsedLessonId);
  if (placementItems.length === 0) notFound();

  return <PlacementTestMode deckId={parsedDeckId} placementItems={placementItems} />;
}
