import ReviewMode from '@/app/(protected)/decks/[deckId]/review/review-mode';
import { getDueReviewsForDeckAction } from '@/server/review.actions';

type Props = {
  params: Promise<{
    deckId: string;
  }>;
};

export default async function ReviewPage({ params }: Props) {
  const { deckId } = await params;
  const dueReviews = await getDueReviewsForDeckAction(Number(deckId));

  console.log(dueReviews);

  return <ReviewMode dueReviews={dueReviews} />;
}
