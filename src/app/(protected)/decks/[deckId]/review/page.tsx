import ReviewMode from '@/app/(protected)/decks/[deckId]/review/_components/review-mode';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { notFound } from 'next/navigation';
import { getReviewPageDataAction } from '@/server/review.actions';
import type { Metadata } from 'next';
import {
  DEFAULT_REVIEW_SESSION_SIZE,
  parseSessionSize,
  REVIEW_SESSION_SIZES,
} from '@/lib/study-session-size';

export const metadata: Metadata = {
  title: 'Review',
  description: 'Review vocabulary that is ready for practice.',
};

type Props = {
  params: Promise<{
    deckId: string;
  }>;
  searchParams: Promise<{ size?: string | string[] }>;
};

export default async function ReviewPage({ params, searchParams }: Props) {
  const { deckId } = await params;
  const selectedSize = parseSessionSize(
    (await searchParams).size,
    REVIEW_SESSION_SIZES,
    DEFAULT_REVIEW_SESSION_SIZE,
    true,
  );
  const parsedDeckId = parsePositiveInteger(deckId);
  if (!parsedDeckId) notFound();
  const data = await getReviewPageDataAction(parsedDeckId, selectedSize);
  if (!data) notFound();

  return (
    <ReviewMode
      deckId={parsedDeckId}
      dueReviews={data.dueReviews}
      totalDueReviews={data.totalDueReviews}
      selectedSize={selectedSize}
      nextReview={data.nextReview}
    />
  );
}
