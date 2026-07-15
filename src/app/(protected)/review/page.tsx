import AllDecksReviewMode from '@/app/(protected)/review/_components/all-decks-review-mode';
import { getAllReviewsPageDataAction } from '@/server/review.actions';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Review due cards',
  description: 'Review due vocabulary across every active deck.',
};

export default async function AllDecksReviewPage() {
  const data = await getAllReviewsPageDataAction();

  return <AllDecksReviewMode dueReviews={data.dueReviews} nextReview={data.nextReview} />;
}
