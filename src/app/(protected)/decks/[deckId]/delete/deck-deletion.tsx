'use client';

import DialogActions from '@/components/shared/dialog-actions';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Label, Modal } from '@heroui/react';
import type { Deck } from '@/types/deck.types';
import { canFinalizeDeckDeletion } from '@/lib/deck-deletion-policy';
import { isActionFailure } from '@/lib/action-result';
import {
  softDeleteDeckAction,
  restrictedHardDeleteDeckAction,
  restoreDeckAction,
} from '@/server/deck-release.actions';
import PageHeader from '@/components/shared/layout/page-header';
import StatusAlert from '@/components/shared/status-alert';
import ConfirmationDialog from '@/components/shared/confirmation-dialog';
import ButtonLink from '@/components/shared/button-link';

export default function DeckDeletion({
  deck,
  protectedFollowerCount,
}: {
  deck: Deck;
  protectedFollowerCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmation, setConfirmation] = useState<'start' | 'permanent' | null>(null);
  const [typedConfirmation, setTypedConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isDeleted = deck.status === 'deleted';
  const eligible =
    isDeleted && canFinalizeDeckDeletion(protectedFollowerCount, deck.retentionUntil);
  const availableAt = deck.retentionUntil
    ? new Intl.DateTimeFormat('en', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'UTC',
      }).format(deck.retentionUntil) + ' UTC'
    : null;

  const run = (operation: 'start' | 'permanent' | 'restore') => {
    if (pending || (operation === 'permanent' && (!eligible || typedConfirmation !== 'DELETE')))
      return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await (operation === 'start'
          ? softDeleteDeckAction(deck.id)
          : operation === 'permanent'
            ? restrictedHardDeleteDeckAction(deck.id)
            : restoreDeckAction(deck.id));
        if (isActionFailure(result)) {
          setError(result.message);
          return;
        }
        setConfirmation(null);
        setTypedConfirmation('');
        if (operation === 'permanent') router.push('/decks');
        else router.refresh();
      } catch (reason) {
        setError(
          reason instanceof Error ? reason.message : 'The operation could not be completed.',
        );
      }
    });
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <PageHeader
        title="Delete deck"
        description={deck.title}
        backLink={{ href: `/decks/${deck.id}`, label: 'Back to deck' }}
      />
      <p className="text-sm leading-6 text-default-600">
        Deletion has two steps. You can restore the deck until you confirm permanent deletion.
        Nothing is permanently deleted automatically.
      </p>
      {error && !confirmation ? <StatusAlert status="danger">{error}</StatusAlert> : null}
      <ol className="space-y-4">
        <li className="rounded-xl border border-default-200 p-5">
          <p className="text-xs font-medium text-default-500">
            Step 1 {isDeleted ? '· Complete' : ''}
          </p>
          <h2 className="mt-1 text-lg font-semibold">Move to deleted decks</h2>
          <p className="mt-2 text-sm leading-6 text-default-600">
            {isDeleted
              ? 'This deck has been removed from your active library and discovery. Existing followers keep access to their saved version during the waiting period.'
              : 'Remove this deck from your active library and discovery. Existing followers keep access to their saved version during the waiting period.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {isDeleted ? (
              <Button variant="secondary" isDisabled={pending} onPress={() => run('restore')}>
                Restore deck
              </Button>
            ) : deck.status === 'archived' ? (
              <>
                <p className="w-full text-sm text-default-600">
                  This deck is archived. Restore it first to start deletion here.
                </p>
                <Button variant="secondary" isDisabled={pending} onPress={() => run('restore')}>
                  Restore deck
                </Button>
              </>
            ) : (
              <Button
                variant="danger"
                isDisabled={pending}
                onPress={() => {
                  setError(null);
                  setConfirmation('start');
                }}
              >
                Move to deleted decks
              </Button>
            )}
          </div>
        </li>
        <li className="rounded-xl border border-danger/25 p-5">
          <p className="text-xs font-medium text-default-500">
            Step 2 {isDeleted ? (eligible ? '· Ready' : '· Waiting period') : ''}
          </p>
          <h2 className="mt-1 text-lg font-semibold">Permanently delete</h2>
          <p className="mt-2 text-sm leading-6 text-default-600">
            Permanently remove this deck from your account. You cannot restore it afterward. Copies
            made by other learners are kept.
          </p>
          <p className="mt-3 text-sm leading-6 text-default-600">
            {isDeleted
              ? eligible
                ? 'Ready when you are. You will confirm once more before deletion.'
                : availableAt
                  ? `Available from ${availableAt}. The 30-day waiting period protects existing followers. Return to this page to finish deletion, or restore the deck above.`
                  : 'Permanent deletion is currently unavailable. You can still restore the deck.'
              : protectedFollowerCount > 0
                ? 'Available 30 days after step 1 because this deck has existing followers.'
                : 'Available immediately after step 1 because this deck has no existing followers.'}
          </p>
          <Button
            className="mt-4"
            variant="danger"
            isDisabled={pending || !eligible}
            onPress={() => {
              setError(null);
              setTypedConfirmation('');
              setConfirmation('permanent');
            }}
          >
            Permanently delete deck
          </Button>
          {isDeleted && !eligible ? (
            <Button
              className="mt-4 sm:ml-3"
              variant="tertiary"
              isDisabled={pending}
              onPress={() => router.refresh()}
            >
              Check availability
            </Button>
          ) : null}
        </li>
      </ol>
      <ButtonLink href={`/decks/${deck.id}/export`} variant="tertiary">
        Export cards before deleting
      </ButtonLink>

      <ConfirmationDialog
        isOpen={confirmation === 'start'}
        onOpenChange={open => {
          if (!open && !pending) setConfirmation(null);
        }}
        title={`Move “${deck.title}” to deleted decks?`}
        description={
          <>
            {protectedFollowerCount > 0
              ? 'Permanent deletion will be available after 30 days.'
              : 'Permanent deletion will be available immediately.'}{' '}
            You will stay on this page to review the next step. You can still restore the deck.
            {error ? (
              <span className="mt-3 block text-danger" role="alert">
                {error}
              </span>
            ) : null}
          </>
        }
        confirmLabel="Move to deleted decks"
        isPending={pending}
        onConfirm={() => run('start')}
      />
      <Modal.Backdrop
        isOpen={confirmation === 'permanent'}
        onOpenChange={open => {
          if (!open && !pending) setConfirmation(null);
        }}
        isDismissable={!pending}
        isKeyboardDismissDisabled={pending}
      >
        <Modal.Container>
          <Modal.Dialog role="alertdialog">
            <Modal.Header>
              <Modal.Heading>Permanently delete “{deck.title}”?</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="space-y-4">
              <p className="text-sm leading-6 text-default-600">
                This permanently removes the deck from your account and cannot be undone. Copies
                made by other learners are kept.
              </p>
              <div className="form-field">
                <Label htmlFor="confirm-deck-deletion">Type DELETE to confirm</Label>
                <Input
                  id="confirm-deck-deletion"
                  value={typedConfirmation}
                  onChange={event => setTypedConfirmation(event.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  disabled={pending}
                />
              </div>
              {error ? <StatusAlert status="danger">{error}</StatusAlert> : null}
            </Modal.Body>
            <DialogActions>
              <Button variant="tertiary" isDisabled={pending} onPress={() => setConfirmation(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                isPending={pending}
                isDisabled={pending || typedConfirmation !== 'DELETE' || !eligible}
                onPress={() => run('permanent')}
              >
                Permanently delete deck
              </Button>
            </DialogActions>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
