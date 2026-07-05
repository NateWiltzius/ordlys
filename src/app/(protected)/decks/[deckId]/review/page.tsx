import ReviewMode from '@/app/(protected)/decks/[deckId]/review/_components/review-mode';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { notFound } from 'next/navigation';
import { getReviewPageDataAction } from '@/server/review.actions';

type Props = {
  params: Promise<{
    deckId: string;
  }>;
};

export default async function ReviewPage({ params }: Props) {
  const { deckId } = await params;
  const parsedDeckId = parsePositiveInteger(deckId);
  if (!parsedDeckId) notFound();
  const dueReviews = await getReviewPageDataAction(parsedDeckId);
  if (!dueReviews) notFound();

  return <ReviewMode deckId={parsedDeckId} dueReviews={dueReviews} />;
}
