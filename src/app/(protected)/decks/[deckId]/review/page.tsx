import ReviewMode from '@/app/(protected)/decks/[deckId]/review/review-mode';
import { getDueReviewsForDeckAction } from '@/server/review.actions';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{
    deckId: string;
  }>;
};

export default async function ReviewPage({ params }: Props) {
  const { deckId } = await params;
  const parsedDeckId = parsePositiveInteger(deckId);
  if (!parsedDeckId) notFound();

  const dueReviews = await getDueReviewsForDeckAction(parsedDeckId);

  return <ReviewMode deckId={parsedDeckId} dueReviews={dueReviews} />;
}
