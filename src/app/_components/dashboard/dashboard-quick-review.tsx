import { BoltIcon } from '@heroicons/react/24/outline';
import ButtonLink from '@/components/shared/button-link';
import { getEstimatedReviewDuration } from '@/lib/study-session-size';
import { STUDY_TONE_STYLES } from '@/lib/study-colors';
import { getDashboardQuickReviewAction } from '@/lib/dashboard-actions';

type Props = {
  reviewsDue: number;
  deckIdsWithReviews: number[];
};

export default function DashboardQuickReview({ reviewsDue, deckIdsWithReviews }: Props) {
  const quickReview = getDashboardQuickReviewAction(reviewsDue, deckIdsWithReviews);
  if (!quickReview) return null;
  const cardCount = quickReview.cardCount;

  return (
    <ButtonLink
      href={quickReview.href}
      size="lg"
      className={`w-full justify-between md:hidden ${STUDY_TONE_STYLES.review.button}`}
    >
      <span className="flex items-center gap-2">
        <BoltIcon className="size-5" aria-hidden="true" />
        Quick review
      </span>
      <span className="text-xs font-medium opacity-90">
        {cardCount} {cardCount === 1 ? 'card' : 'cards'} · {getEstimatedReviewDuration(cardCount)}
      </span>
    </ButtonLink>
  );
}
