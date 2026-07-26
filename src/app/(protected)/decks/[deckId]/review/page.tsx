import ReviewMode from '@/app/(protected)/decks/[deckId]/review/_components/review-mode';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { notFound } from 'next/navigation';
import { getReviewPageData } from '@/server/data/review-page-data';
import type { Metadata } from 'next';
import { parseReviewSessionSize, REVIEW_SESSION_SIZE_COOKIE } from '@/lib/study-session-size';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'Review',
  description: 'Review cards that are ready for practice.',
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
  const selectedSize = parseReviewSessionSize(
    (await searchParams).size,
    (await cookies()).get(REVIEW_SESSION_SIZE_COOKIE)?.value,
  );
  const data = await getReviewPageData(parsedDeckId, selectedSize);
  if (!data) notFound();

  return (
    <ReviewMode
      deckId={parsedDeckId}
      deckTitle={data.deckTitle}
      dueReviews={data.dueReviews}
      nextReview={data.nextReview}
      selectedSize={selectedSize}
      availableCount={data.availableCount}
    />
  );
}
