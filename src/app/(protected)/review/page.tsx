import AllDecksReviewMode from '@/app/(protected)/review/_components/all-decks-review-mode';
import { getAllReviewsPageDataAction } from '@/server/review.actions';
import type { Metadata } from 'next';
import {
  DEFAULT_REVIEW_SESSION_SIZE,
  parseSessionSize,
  REVIEW_SESSION_SIZES,
} from '@/lib/study-session-size';

export const metadata: Metadata = {
  title: 'Review due cards',
  description: 'Review due vocabulary across every active deck.',
};

type Props = { searchParams: Promise<{ size?: string | string[] }> };

export default async function AllDecksReviewPage({ searchParams }: Props) {
  const selectedSize = parseSessionSize(
    (await searchParams).size,
    REVIEW_SESSION_SIZES,
    DEFAULT_REVIEW_SESSION_SIZE,
    true,
  );
  const data = await getAllReviewsPageDataAction(selectedSize);

  return (
    <AllDecksReviewMode
      dueReviews={data.dueReviews}
      nextReview={data.nextReview}
      selectedSize={selectedSize}
      availableCount={data.availableCount}
    />
  );
}
