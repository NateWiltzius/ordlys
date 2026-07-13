'use client';

import {
  moderationRemoveDeckAction,
  moderationReviewDeckAction,
  permanentlyDeleteFollowProgressAction,
  reportDeckAction,
  restrictedHardDeleteDeckAction,
} from '@/server/deck-release.actions';
import { unfollowDeckAction } from '@/server/deck-follow.actions';
import type { Deck } from '@/types/deck.types';
import { Button, Input, Label, Modal, Popover, TextArea, useOverlayState } from '@heroui/react';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState, useTransition } from 'react';
import ConfirmationDialog from '@/components/shared/confirmation-dialog';
import StatusAlert from '@/components/shared/status-alert';
import { isActionFailure } from '@/lib/action-result';

type ConfirmationAction = 'delete-progress' | 'hard-delete' | 'moderate-removal' | 'unfollow';

export default function DeckSafetyControls({
  deckId,
  deckTitle,
  status,
  retentionUntil,
  isOwned,
  isFollowing,
  canModerate,
}: {
  deckId: number;
  deckTitle: string;
  status: Deck['status'];
  retentionUntil: Deck['retentionUntil'];
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const reportModalState = useOverlayState();
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const hardDeleteEligible =
    status === 'deleted' && retentionUntil !== null && retentionUntil.getTime() <= Date.now();

  function run(operation: () => Promise<unknown>, success: string, leave = false) {
    startTransition(async () => {
      try {
        setFeedback(null);
        const result = await operation();
        if (isActionFailure(result)) {
          setFeedback({ status: 'danger', message: result.message });
          return;
        }
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

  function confirm(action: ConfirmationAction) {
    setIsMenuOpen(false);
    setConfirmation(action);
  }

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Popover isOpen={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <Button
          variant="tertiary"
          aria-label={`More actions for ${deckTitle}`}
          aria-expanded={isMenuOpen}
        >
          More
          <EllipsisHorizontalIcon className="size-5" aria-hidden="true" />
        </Button>
        <Popover.Content placement="bottom end">
          <Popover.Dialog aria-label={`Actions for ${deckTitle}`} className="w-56 p-2">
            <div className="flex flex-col gap-1">
              {isOwned ? (
                <Link
                  href={`/decks/${deckId}/export`}
                  download={`${deckTitle}.csv`}
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-default-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Export CSV
                </Link>
              ) : null}
              {isFollowing ? (
                <Button
                  size="sm"
                  variant="tertiary"
                  className="w-full justify-start"
                  isDisabled={pending}
                  onPress={() => confirm('unfollow')}
                >
                  Unfollow
                </Button>
              ) : null}
              {!isOwned ? (
                <Button
                  size="sm"
                  variant="tertiary"
                  className="w-full justify-start"
                  isDisabled={pending}
                  onPress={() => {
                    setIsMenuOpen(false);
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
                  className="w-full justify-start"
                  isDisabled={pending}
                  onPress={() => confirm('delete-progress')}
                >
                  Delete progress
                </Button>
              ) : null}
              {canModerate && status !== 'moderation_removed' ? (
                <>
                  <Button
                    size="sm"
                    variant="tertiary"
                    className="w-full justify-start"
                    isDisabled={pending}
                    onPress={() => {
                      setIsMenuOpen(false);
                      run(() => moderationReviewDeckAction(deckId), 'Deck marked under review.');
                    }}
                  >
                    Mark under review
                  </Button>
                  <Button
                    size="sm"
                    variant="danger-soft"
                    className="w-full justify-start"
                    isDisabled={pending}
                    onPress={() => confirm('moderate-removal')}
                  >
                    Moderate removal
                  </Button>
                </>
              ) : null}
              {isOwned && status === 'deleted' ? (
                <>
                  <Button
                    size="sm"
                    variant="danger-soft"
                    className="w-full justify-start"
                    isDisabled={pending || !hardDeleteEligible}
                    onPress={() => confirm('hard-delete')}
                  >
                    Finalize deletion
                  </Button>
                  {!hardDeleteEligible && retentionUntil ? (
                    <span className="px-3 pb-1 text-xs text-default-500">
                      Available after {retentionUntil.toLocaleDateString()}.
                    </span>
                  ) : null}
                </>
              ) : null}
            </div>
          </Popover.Dialog>
        </Popover.Content>
      </Popover>
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
        isPending={pending}
        onConfirm={() => {
          const action = confirmation;
          setConfirmation(null);
          if (action === 'delete-progress') {
            run(() => permanentlyDeleteFollowProgressAction(deckId), 'Progress deleted.', true);
          }
          if (action === 'unfollow') {
            run(() => unfollowDeckAction(deckId), 'Deck unfollowed.', true);
          }
          if (action === 'moderate-removal') {
            run(() => moderationRemoveDeckAction(deckId), 'Deck removed by moderation.', true);
          }
          if (action === 'hard-delete') {
            run(() => restrictedHardDeleteDeckAction(deckId), 'Deletion finalized.', true);
          }
        }}
      />
      <Modal.Backdrop isOpen={reportModalState.isOpen} onOpenChange={reportModalState.setOpen}>
        <Modal.Container scroll="inside">
          <Modal.Dialog className="sm:max-w-md">
            <Modal.CloseTrigger />
            <Modal.Header className="space-y-1">
              <Modal.Heading>Report this deck</Modal.Heading>
              <p className="text-sm text-default-500">
                Tell us what needs review. Your report will be associated with this deck.
              </p>
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
                  isDisabled={pending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full sm:w-auto"
                  isDisabled={!reportReason.trim()}
                  isPending={pending}
                >
                  Submit report
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
