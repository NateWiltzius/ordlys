import PlacementTestMode from '@/app/(protected)/decks/[deckId]/placement/[lessonId]/_components/placement-test-mode';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { notFound } from 'next/navigation';
import { getPlacementPageDataAction } from '@/server/review.actions';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Placement test',
  description: 'Test existing knowledge and place familiar cards into review.',
};

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
  const placementItems = await getPlacementPageDataAction(parsedDeckId, parsedLessonId);
  if (!placementItems?.length) notFound();

  return <PlacementTestMode deckId={parsedDeckId} placementItems={placementItems} />;
}
