import ReviewMode from '@/app/(protected)/decks/[deckId]/review/_components/review-mode';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { notFound } from 'next/navigation';
import { getReviewPageDataAction } from '@/server/review.actions';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Review',
  description: 'Review vocabulary that is ready for practice.',
};

type Props = {
  params: Promise<{
    deckId: string;
  }>;
};

export default async function ReviewPage({ params }: Props) {
  const { deckId } = await params;
  const parsedDeckId = parsePositiveInteger(deckId);
  if (!parsedDeckId) notFound();
  const data = await getReviewPageDataAction(parsedDeckId);
  if (!data) notFound();

  return (
    <ReviewMode deckId={parsedDeckId} dueReviews={data.dueReviews} nextReview={data.nextReview} />
  );
}
