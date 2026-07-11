'use client';

import {
  moderationRemoveDeckAction,
  moderationReviewDeckAction,
  permanentlyDeleteFollowProgressAction,
  reportDeckAction,
  restrictedHardDeleteDeckAction,
} from '@/server/deck-release.actions';
import type { Deck } from '@/types/deck.types';
import { Button, Input, Label, Modal, TextArea, useOverlayState } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState, useTransition } from 'react';
import ConfirmationDialog from '@/components/shared/confirmation-dialog';
import StatusAlert from '@/components/shared/status-alert';

type ConfirmationAction = 'delete-progress' | 'hard-delete' | 'moderate-removal';

export default function DeckSafetyControls({
  deckId,
  status,
  isOwned,
  isFollowing,
  canModerate,
}: {
  deckId: number;
  status: Deck['status'];
  isOwned: boolean;
  isFollowing: boolean;
  canModerate: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    status: 'danger' | 'success';
    message: string;
  } | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationAction | null>(null);
  const reportModalState = useOverlayState();
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');

  function run(operation: () => Promise<unknown>, success: string, leave = false) {
    startTransition(async () => {
      try {
        setFeedback(null);
        await operation();
        setFeedback({ status: 'success', message: success });
        if (leave) router.push('/decks');
        else router.refresh();
      } catch (error) {
        setFeedback({
          status: 'danger',
          message: error instanceof Error ? error.message : 'The operation could not be completed.',
        });
      }
    });
  }

  function report(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const reason = reportReason.trim();
    if (!reason) return;
    const details = reportDetails.trim() || undefined;
    reportModalState.close();
    run(() => reportDeckAction(deckId, reason, details), 'Report submitted.');
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!isOwned ? (
        <Button
          size="sm"
          variant="tertiary"
          isDisabled={pending}
          onPress={() => {
            setReportReason('');
            setReportDetails('');
            reportModalState.open();
          }}
        >
          Report
        </Button>
      ) : null}
      {isFollowing ? (
        <Button
          size="sm"
          variant="danger-soft"
          isDisabled={pending}
          onPress={() => setConfirmation('delete-progress')}
        >
          Delete progress
        </Button>
      ) : null}
      {canModerate && status !== 'moderation_removed' ? (
        <>
          <Button
            size="sm"
            variant="tertiary"
            isDisabled={pending}
            onPress={() =>
              run(() => moderationReviewDeckAction(deckId), 'Deck marked under review.')
            }
          >
            Mark under review
          </Button>
          <Button
            size="sm"
            variant="danger-soft"
            isDisabled={pending}
            onPress={() => setConfirmation('moderate-removal')}
          >
            Moderate removal
          </Button>
        </>
      ) : null}
      {isOwned && status === 'deleted' ? (
        <Button
          size="sm"
          variant="danger-soft"
          isDisabled={pending}
          onPress={() => setConfirmation('hard-delete')}
        >
          Hard delete
        </Button>
      ) : null}
      {feedback ? (
        <StatusAlert status={feedback.status} className="w-full">
          {feedback.message}
        </StatusAlert>
      ) : null}
      <ConfirmationDialog
        isOpen={confirmation !== null}
        onOpenChange={isOpen => {
          if (!isOpen) setConfirmation(null);
        }}
        title={
          confirmation === 'delete-progress'
            ? 'Delete all progress?'
            : confirmation === 'moderate-removal'
              ? 'Remove this deck for moderation?'
              : 'Attempt hard deletion?'
        }
        description={
          confirmation === 'delete-progress'
            ? 'All learning progress for this deck will be permanently deleted. This cannot be undone.'
            : confirmation === 'moderate-removal'
              ? 'Learner access will be revoked.'
              : 'Dependencies will leave a tombstone where required.'
        }
        confirmLabel={
          confirmation === 'delete-progress'
            ? 'Delete progress'
            : confirmation === 'moderate-removal'
              ? 'Remove deck'
              : 'Hard delete'
        }
        isPending={pending}
        onConfirm={() => {
          const action = confirmation;
          setConfirmation(null);
          if (action === 'delete-progress') {
            run(() => permanentlyDeleteFollowProgressAction(deckId), 'Progress deleted.', true);
          }
          if (action === 'moderate-removal') {
            run(() => moderationRemoveDeckAction(deckId), 'Deck removed by moderation.', true);
          }
          if (action === 'hard-delete') {
            run(
              () => restrictedHardDeleteDeckAction(deckId),
              'Hard-deletion eligibility processed.',
              true,
            );
          }
        }}
      />
      <Modal state={reportModalState}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-md">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Report this deck</Modal.Heading>
              </Modal.Header>
              <form onSubmit={report}>
                <Modal.Body className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`report-reason-${deckId}`}>Reason</Label>
                    <Input
                      id={`report-reason-${deckId}`}
                      value={reportReason}
                      onChange={event => setReportReason(event.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`report-details-${deckId}`}>Details (optional)</Label>
                    <TextArea
                      id={`report-details-${deckId}`}
                      value={reportDetails}
                      onChange={event => setReportDetails(event.target.value)}
                      rows={4}
                    />
                  </div>
                </Modal.Body>
                <Modal.Footer className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="tertiary"
                    className="w-full sm:w-auto"
                    onPress={reportModalState.close}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full sm:w-auto"
                    isDisabled={!reportReason.trim()}
                  >
                    Submit report
                  </Button>
                </Modal.Footer>
              </form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
