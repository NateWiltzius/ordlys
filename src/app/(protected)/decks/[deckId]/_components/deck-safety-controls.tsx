'use client';

import type { Deck } from '@/types/deck.types';
import { canFinalizeDeckDeletion } from '@/lib/deck-deletion-policy';
import { useState } from 'react';
import StatusAlert from '@/components/shared/status-alert';
import DeckSafetyMenu from './deck-safety-menu';
import { DeckReportModal, DeckSafetyConfirmationDialog } from './deck-safety-dialogs';
import { type DeckSafetyConfirmation, useDeckSafetyActions } from './use-deck-safety-actions';

type Props = {
  deckId: number;
  deckTitle: string;
  status: Deck['status'];
  retentionUntil: Deck['retentionUntil'];
  isOwned: boolean;
  isFollowing: boolean;
  canFollow: boolean;
  canModerate: boolean;
  protectedFollowerCount: number | null;
};

export default function DeckSafetyControls({
  deckId,
  deckTitle,
  status,
  retentionUntil,
  isOwned,
  isFollowing,
  canFollow,
  canModerate,
  protectedFollowerCount,
}: Props) {
  const [confirmation, setConfirmation] = useState<DeckSafetyConfirmation | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const actions = useDeckSafetyActions(deckId);
  const hardDeleteEligible =
    status === 'deleted' &&
    protectedFollowerCount !== null &&
    canFinalizeDeckDeletion(protectedFollowerCount, retentionUntil);

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <DeckSafetyMenu
        deckId={deckId}
        deckTitle={deckTitle}
        status={status}
        retentionUntil={retentionUntil}
        isOwned={isOwned}
        isFollowing={isFollowing}
        canFollow={canFollow}
        canModerate={canModerate}
        hardDeleteEligible={hardDeleteEligible}
        pending={actions.pending}
        isOpen={isMenuOpen}
        onOpenChange={setIsMenuOpen}
        onConfirm={setConfirmation}
        onFollow={actions.follow}
        onMarkUnderReview={actions.markUnderReview}
        onOpenReport={() => setIsReportOpen(true)}
      />

      {actions.feedback ? (
        <StatusAlert status={actions.feedback.status} className="w-full">
          {actions.feedback.message}
        </StatusAlert>
      ) : null}

      <DeckSafetyConfirmationDialog
        confirmation={confirmation}
        deckTitle={deckTitle}
        pending={actions.pending}
        onClose={() => setConfirmation(null)}
        onConfirm={actions.executeConfirmation}
      />

      {isReportOpen ? (
        <DeckReportModal
          deckId={deckId}
          pending={actions.pending}
          onClose={() => setIsReportOpen(false)}
          onSubmit={actions.submitReport}
        />
      ) : null}
    </div>
  );
}
