import type { DeckSafetyConfirmation } from './use-deck-safety-actions';
import type { Deck } from '@/types/deck.types';
import { Button, ListBox, Popover } from '@heroui/react';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';

type Props = {
  deckId: number;
  deckTitle: string;
  status: Deck['status'];
  isOwned: boolean;
  isFollowing: boolean;
  canFollow: boolean;
  canModerate: boolean;
  pending: boolean;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (action: DeckSafetyConfirmation) => void;
  onFollow: () => void;
  onMarkUnderReview: () => void;
  onOpenReport: () => void;
};

export default function DeckSafetyMenu({
  deckId,
  deckTitle,
  status,
  isOwned,
  isFollowing,
  canFollow,
  canModerate,
  pending,
  isOpen,
  onOpenChange,
  onConfirm,
  onFollow,
  onMarkUnderReview,
  onOpenReport,
}: Props) {
  const closeThen = (operation: () => void) => {
    onOpenChange(false);
    operation();
  };

  return (
    <Popover isOpen={isOpen} onOpenChange={onOpenChange}>
      <Button
        variant="tertiary"
        isIconOnly
        aria-label={`More actions for ${deckTitle}`}
        aria-expanded={isOpen}
      >
        <EllipsisHorizontalIcon className="size-5" aria-hidden="true" />
      </Button>
      <Popover.Content placement="bottom end">
        <Popover.Dialog className="w-56 p-1">
          <ListBox aria-label={`Actions for ${deckTitle}`} selectionMode="none">
            {isOwned ? (
              <ListBox.Item
                id="export"
                href={`/decks/${deckId}/export`}
                download={`${deckTitle}.csv`}
                onAction={() => onOpenChange(false)}
              >
                Export CSV
              </ListBox.Item>
            ) : null}
            {isFollowing ? (
              <ListBox.Item
                id="unfollow"
                isDisabled={pending}
                onAction={() => closeThen(() => onConfirm('unfollow'))}
              >
                Unfollow deck
              </ListBox.Item>
            ) : canFollow ? (
              <ListBox.Item id="follow" isDisabled={pending} onAction={() => closeThen(onFollow)}>
                Follow deck
              </ListBox.Item>
            ) : null}
            {!isOwned ? (
              <ListBox.Item
                id="report"
                isDisabled={pending}
                onAction={() => closeThen(onOpenReport)}
              >
                Report
              </ListBox.Item>
            ) : null}
            {isFollowing ? (
              <ListBox.Item
                id="delete-progress"
                variant="danger"
                className="text-danger"
                isDisabled={pending}
                onAction={() => closeThen(() => onConfirm('delete-progress'))}
              >
                Delete progress
              </ListBox.Item>
            ) : null}
            {canModerate && status !== 'moderation_removed' ? (
              <>
                <ListBox.Item
                  id="mark-under-review"
                  isDisabled={pending}
                  onAction={() => closeThen(onMarkUnderReview)}
                >
                  Mark under review
                </ListBox.Item>
                <ListBox.Item
                  id="moderate-removal"
                  variant="danger"
                  className="text-danger"
                  isDisabled={pending}
                  onAction={() => closeThen(() => onConfirm('moderate-removal'))}
                >
                  Moderate removal
                </ListBox.Item>
              </>
            ) : null}
            {isOwned && status !== 'moderation_removed' ? (
              <ListBox.Item
                id="delete-deck"
                href={`/decks/${deckId}/delete`}
                className="text-danger"
                onAction={() => onOpenChange(false)}
              >
                {status === 'deleted' ? 'Review deletion' : 'Delete deck'}
              </ListBox.Item>
            ) : null}
          </ListBox>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
