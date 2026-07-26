'use client';

import type { DeckSafetyConfirmation } from './use-deck-safety-actions';
import ConfirmationDialog from '@/components/shared/confirmation-dialog';
import { Button, Input, Label, Modal, TextArea } from '@heroui/react';
import { FormEvent, useState } from 'react';

export function DeckSafetyConfirmationDialog({
  confirmation,
  deckTitle,
  pending,
  onClose,
  onConfirm,
}: {
  confirmation: DeckSafetyConfirmation | null;
  deckTitle: string;
  pending: boolean;
  onClose: () => void;
  onConfirm: (action: DeckSafetyConfirmation) => void;
}) {
  return (
    <ConfirmationDialog
      isOpen={confirmation !== null}
      onOpenChange={isOpen => {
        if (!isOpen) onClose();
      }}
      title={
        confirmation === 'delete-progress'
          ? 'Delete all progress?'
          : confirmation === 'unfollow'
            ? `Unfollow “${deckTitle}”?`
            : confirmation === 'moderate-removal'
              ? 'Remove this deck for moderation?'
              : 'Finalize deletion?'
      }
      description={
        confirmation === 'delete-progress'
          ? 'All learning progress for this deck will be permanently deleted. This cannot be undone.'
          : confirmation === 'unfollow'
            ? 'Author updates will stop, but your progress is retained if you follow the deck again.'
            : confirmation === 'moderate-removal'
              ? 'Learner access will be revoked.'
              : 'This permanently removes the deck from your account. Releases or lineage required by other records will remain under an anonymized tombstone.'
      }
      confirmLabel={
        confirmation === 'delete-progress'
          ? 'Delete progress'
          : confirmation === 'unfollow'
            ? 'Unfollow deck'
            : confirmation === 'moderate-removal'
              ? 'Remove deck'
              : 'Finalize deletion'
      }
      tone={confirmation === 'unfollow' ? 'warning' : 'danger'}
      isPending={pending}
      onConfirm={() => {
        if (confirmation) onConfirm(confirmation);
        onClose();
      }}
    />
  );
}

export function DeckReportModal({
  deckId,
  pending,
  onClose,
  onSubmit,
}: {
  deckId: number;
  pending: boolean;
  onClose: () => void;
  onSubmit: (reason: string, details?: string) => void;
}) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedReason = reason.trim();
    if (!normalizedReason) return;
    onSubmit(normalizedReason, details.trim() || undefined);
    onClose();
  };

  return (
    <Modal.Backdrop isOpen onOpenChange={isOpen => !isOpen && onClose()}>
      <Modal.Container scroll="inside">
        <Modal.Dialog className="min-h-0 sm:max-w-md">
          <Modal.CloseTrigger />
          <Modal.Header className="space-y-1">
            <Modal.Heading>Report this deck</Modal.Heading>
            <p className="text-sm text-default-500">
              Tell us what needs review. Your report will be associated with this deck.
            </p>
          </Modal.Header>
          <form onSubmit={submit} className="mt-2 flex min-h-0 flex-1 flex-col">
            <Modal.Body className="space-y-4">
              <div className="form-field">
                <Label htmlFor={`report-reason-${deckId}`}>Reason</Label>
                <Input
                  id={`report-reason-${deckId}`}
                  value={reason}
                  onChange={event => setReason(event.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="form-field">
                <Label htmlFor={`report-details-${deckId}`}>Details (optional)</Label>
                <TextArea
                  id={`report-details-${deckId}`}
                  value={details}
                  onChange={event => setDetails(event.target.value)}
                  rows={4}
                />
              </div>
            </Modal.Body>
            <Modal.Footer className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="tertiary"
                className="w-full sm:w-auto"
                onPress={onClose}
                isDisabled={pending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="w-full sm:w-auto"
                isDisabled={!reason.trim()}
                isPending={pending}
              >
                Submit report
              </Button>
            </Modal.Footer>
          </form>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
