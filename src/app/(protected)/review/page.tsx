import AllDecksReviewMode from '@/app/(protected)/review/_components/all-decks-review-mode';
import { getAllReviewsPageDataAction } from '@/server/review.actions';
import type { Metadata } from 'next';
import { parseReviewSessionSize, REVIEW_SESSION_SIZE_COOKIE } from '@/lib/study-session-size';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'Review due cards',
  description: 'Review due cards across every active deck.',
};

type Props = { searchParams: Promise<{ size?: string | string[] }> };

export default async function AllDecksReviewPage({ searchParams }: Props) {
  const selectedSize = parseReviewSessionSize(
    (await searchParams).size,
    (await cookies()).get(REVIEW_SESSION_SIZE_COOKIE)?.value,
  );
  const data = await getAllReviewsPageDataAction(selectedSize);

  return (
    <AllDecksReviewMode
      dueReviews={data.dueReviews}
      nextReview={data.nextReview}
      deckBreakdown={data.deckBreakdown}
      selectedSize={selectedSize}
      availableCount={data.availableCount}
    />
  );
}
