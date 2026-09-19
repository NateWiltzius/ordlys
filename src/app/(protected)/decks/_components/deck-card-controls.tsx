import type { DeckCardConfirmation } from './use-deck-card-actions';
import ConfirmationDialog from '@/components/shared/confirmation-dialog';
import type { DeckCardAction } from '@/lib/deck-card-actions';
import { Button, ListBox, Popover } from '@heroui/react';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';

export function DeckCardMenu({
  deckTitle,
  actions,
  pending,
  isOpen,
  onOpenChange,
  onAction,
}: {
  deckTitle: string;
  actions: DeckCardAction[];
  pending: boolean;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAction: (key: React.Key) => void;
}) {
  if (actions.length === 0) return null;

  return (
    <Popover isOpen={isOpen} onOpenChange={onOpenChange}>
      <Button
        variant="tertiary"
        size="sm"
        isIconOnly
        isDisabled={pending}
        aria-label={`More actions for ${deckTitle}`}
      >
        <EllipsisVerticalIcon className="h-5 w-5" />
      </Button>
      <Popover.Content placement="bottom end">
        <Popover.Dialog className="w-44 p-1">
          <ListBox aria-label={`Actions for ${deckTitle}`} selectionMode="none" onAction={onAction}>
            {actions.map(action => (
              <ListBox.Item
                key={action}
                id={action}
                variant={action === 'delete' ? 'danger' : undefined}
                className={action === 'delete' ? 'text-danger' : undefined}
              >
                {
                  {
                    copy: 'Copy & edit',
                    delete: 'Delete deck',
                    follow: 'Follow deck',
                    manage: 'Manage deck',
                    review: 'Review deck',
                    restore: 'Restore deck',
                    unfollow: 'Unfollow deck',
                  }[action]
                }
              </ListBox.Item>
            ))}
          </ListBox>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}

export function DeckCardConfirmationDialog({
  deckTitle,
  confirmation,
  pending,
  onClose,
  onConfirm,
}: {
  deckTitle: string;
  confirmation: DeckCardConfirmation | null;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <ConfirmationDialog
      isOpen={confirmation !== null}
      onOpenChange={isOpen => {
        if (!isOpen && !pending) onClose();
      }}
      title={confirmation === 'copy' ? `Copy “${deckTitle}”?` : `Unfollow “${deckTitle}”?`}
      description={
        confirmation === 'copy'
          ? 'The published release becomes an independent private deck. Source learning progress is not copied.'
          : 'Updates will stop, but your learning progress will be retained.'
      }
      confirmLabel={confirmation === 'copy' ? 'Copy deck' : 'Unfollow deck'}
      tone={confirmation === 'copy' ? 'neutral' : 'warning'}
      isPending={pending}
      onConfirm={onConfirm}
    />
  );
}
