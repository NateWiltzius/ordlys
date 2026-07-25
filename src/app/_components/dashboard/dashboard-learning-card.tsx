'use client';

import StudyActionCard from '@/app/(protected)/decks/[deckId]/_components/study-action-card';
import ButtonLink from '@/components/shared/button-link';
import { STUDY_TONE_STYLES } from '@/lib/study-colors';
import { Deck } from '@/types/deck.types';
import { ReviewCounts } from '@/types/review.types';
import { AcademicCapIcon } from '@heroicons/react/24/outline';
import { Button, Chip, Modal, useOverlayState } from '@heroui/react';

type Props = {
  decks: Pick<Deck, 'id' | 'title'>[];
  deckStats: Record<number, Pick<ReviewCounts, 'newWordsAvailable'>>;
  newWordsAvailable: number;
};

export default function DashboardLearningCard({ decks, deckStats, newWordsAvailable }: Props) {
  const modalState = useOverlayState();
  const decksWithNewWords = decks.filter(deck => deckStats[deck.id].newWordsAvailable > 0);
  const hasNewWords = newWordsAvailable > 0;

  const learningCard = (
    <StudyActionCard
      title="Learn new cards"
      description="Choose a deck and start learning new material."
      count={newWordsAvailable}
      countLabel="new cards across your decks"
      actionLabel="Start learning"
      icon={AcademicCapIcon}
      tone="learning"
      isModalTrigger={hasNewWords}
      isDisabled={!hasNewWords}
      unavailableAction={
        <Button variant="secondary" size="lg" className="w-full" isDisabled>
          No new cards available
        </Button>
      }
    />
  );

  if (!hasNewWords) return learningCard;

  return (
    <Modal state={modalState}>
      <Modal.Trigger
        aria-label="Choose a deck to start learning"
        className="group block h-full cursor-pointer rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        {learningCard}
      </Modal.Trigger>

      <Modal.Backdrop>
        <Modal.Container scroll="inside">
          <Modal.Dialog className="sm:max-w-lg">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Choose what to learn</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className="mb-3 text-sm text-default-600">
                Choose a deck to start learning new cards.
              </p>
              <ul className="divide-y divide-default-200 rounded-lg border border-default-200">
                {decksWithNewWords.map(deck => {
                  const count = deckStats[deck.id].newWordsAvailable;

                  return (
                    <li
                      key={deck.id}
                      className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <p className="truncate font-medium text-default-900">{deck.title}</p>
                        <Chip size="sm" className={`shrink-0 ${STUDY_TONE_STYLES.learning.accent}`}>
                          {count} new
                        </Chip>
                      </div>
                      <ButtonLink
                        href={`/decks/${deck.id}/learn`}
                        className={`w-full shrink-0 sm:w-auto ${STUDY_TONE_STYLES.learning.button}`}
                      >
                        Learn <span className="sr-only">{deck.title}</span>
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
