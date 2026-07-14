'use client';

import StudyActionCard from '@/app/(protected)/decks/[deckId]/_components/study-action-card';
import ButtonLink from '@/components/shared/button-link';
import { STUDY_TONE_STYLES } from '@/lib/study-colors';
import { Deck } from '@/types/deck.types';
import { ReviewCounts } from '@/types/review.types';
import { ClockIcon } from '@heroicons/react/24/outline';
import { Button, Chip, Modal, useOverlayState } from '@heroui/react';

type Props = {
  decks: Pick<Deck, 'id' | 'title'>[];
  deckStats: Record<number, Pick<ReviewCounts, 'reviewsDue'>>;
  reviewsDue: number;
};

export default function DashboardReviewCard({ decks, deckStats, reviewsDue }: Props) {
  const modalState = useOverlayState();
  const decksWithReviews = decks.filter(deck => (deckStats[deck.id]?.reviewsDue ?? 0) > 0);
  const hasReviewsDue = reviewsDue > 0;

  return (
    <Modal state={modalState}>
      <StudyActionCard
        title="Review due cards"
        description="Review everything together or focus on a single deck."
        count={reviewsDue}
        countLabel="reviews due across your decks"
        actionLabel="Start review"
        icon={ClockIcon}
        tone="review"
        onAction={hasReviewsDue ? modalState.open : undefined}
        isDisabled={!hasReviewsDue}
        unavailableAction={
          <Button variant="secondary" size="lg" className="w-full" isDisabled>
            No reviews due
          </Button>
        }
      />

      <Modal.Backdrop>
        <Modal.Container scroll="inside">
          <Modal.Dialog className="sm:max-w-lg">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Choose what to review</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className="mb-3 text-sm text-default-600">
                Review everything together or focus on one deck.
              </p>
              <ul className="divide-y divide-default-200 rounded-xl border border-default-200">
                <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <p className="truncate font-medium text-default-900">All decks</p>
                    <Chip size="sm" variant="soft" color="success" className="shrink-0">
                      {reviewsDue} due
                    </Chip>
                  </div>
                  <ButtonLink
                    href="/review"
                    className={`w-full shrink-0 sm:w-auto ${STUDY_TONE_STYLES.review.button}`}
                  >
                    Review all
                  </ButtonLink>
                </li>
                {decksWithReviews.map(deck => {
                  const count = deckStats[deck.id]?.reviewsDue ?? 0;

                  return (
                    <li
                      key={deck.id}
                      className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <p className="truncate font-medium text-default-900">{deck.title}</p>
                        <Chip size="sm" variant="soft" color="success" className="shrink-0">
                          {count} due
                        </Chip>
                      </div>
                      <ButtonLink
                        href={`/decks/${deck.id}/review`}
                        className={`w-full shrink-0 sm:w-auto ${STUDY_TONE_STYLES.review.button}`}
                      >
                        Review deck
                      </ButtonLink>
                    </li>
                  );
                })}
              </ul>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="tertiary" onPress={modalState.close} className="w-full sm:w-auto">
                Cancel
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
