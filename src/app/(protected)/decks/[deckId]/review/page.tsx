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
  const parsedDeckId = parsePositiveInteger(deckId);
  if (!parsedDeckId) notFound();
  const selectedSize = parseSessionSize(
    (await searchParams).size,
    REVIEW_SESSION_SIZES,
    DEFAULT_REVIEW_SESSION_SIZE,
  );
  const data = await getReviewPageDataAction(parsedDeckId, selectedSize as number);
  if (!data) notFound();

  return (
    <ReviewMode
      deckId={parsedDeckId}
      dueReviews={data.dueReviews}
      nextReview={data.nextReview}
      selectedSize={selectedSize as number}
      availableCount={data.availableCount}
    />
  );
}
