'use client';

import type { DeckProvenance } from '@/db/queries/deck-release.queries';
import { publishDeckAction } from '@/server/deck-release.actions';
import type { DeckRelease } from '@/types/deck-release.types';
import type { Deck } from '@/types/deck.types';
import PageSection from '@/components/shared/layout/page-section';
import { Alert, Button, Chip, Input, Label } from '@heroui/react';
import { useState } from 'react';
import { usePublicationActions } from './use-publication-actions';
import {
  DeckCopyPolicySetting,
  DeckLifecycleActions,
  DeckVisibilitySetting,
  PublicationHistory,
} from './publication-settings';

type Props = {
  deck: Deck;
  releases: DeckRelease[];
  hasUnpublishedChanges: boolean;
  provenance: DeckProvenance | null;
};

export default function PublicationPanel({
  deck,
  releases,
  hasUnpublishedChanges,
  provenance,
}: Props) {
  const [summary, setSummary] = useState('');
  const { activeOperation, feedback, pending, run } = usePublicationActions();
  const currentRelease = releases.find(release => release.id === deck.currentReleaseId);

  return (
    <PageSection
      title="Publishing"
      description="Publish changes when you are ready to share them. Your edits stay private until then."
      action={
        <Chip size="sm" variant="soft">
          {currentRelease
            ? hasUnpublishedChanges
              ? 'Changes ready to publish'
              : 'Published'
            : 'Private draft'}
        </Chip>
      }
      contentClassName="space-y-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="form-field flex-1">
          <Label htmlFor={`change-summary-${deck.id}`}>What changed? (optional)</Label>
          <Input
            id={`change-summary-${deck.id}`}
            value={summary}
            onChange={event => setSummary(event.target.value)}
            placeholder="Brief note for learners"
            variant="secondary"
            fullWidth
          />
        </div>
        <Button
          isPending={pending && activeOperation === 'publish'}
          isDisabled={!hasUnpublishedChanges && Boolean(currentRelease)}
          onPress={() =>
            run(
              'publish',
              () =>
                publishDeckAction(
                  deck.id,
                  summary.trim() || (currentRelease ? 'Updated deck' : 'Initial release'),
                  crypto.randomUUID(),
                ),
              'Changes published.',
            )
          }
        >
          {currentRelease ? 'Publish changes' : 'Publish deck'}
        </Button>
      </div>

      {!currentRelease ? (
        <p className="rounded-lg border border-default-200 bg-default-50 px-4 py-3 text-sm text-default-600">
          Publish this deck before making it available to other learners.
        </p>
      ) : null}

      <DeckVisibilitySetting
        deck={deck}
        provenance={provenance}
        currentRelease={currentRelease}
        pending={pending}
        run={run}
      />

      <details className="overflow-hidden rounded-lg border border-default-200 bg-default-50/50">
        <summary className="cursor-pointer px-4 py-3 font-medium text-default-700">
          Advanced publishing settings
        </summary>
        <div className="space-y-5 border-t border-default-200 bg-background p-4">
          <DeckCopyPolicySetting deck={deck} provenance={provenance} pending={pending} run={run} />
          <PublicationHistory releases={releases} />
          <DeckLifecycleActions
            deckId={deck.id}
            pending={pending}
            activeOperation={activeOperation}
            run={run}
          />
        </div>
      </details>

      {feedback ? (
        <Alert status={feedback.status} role="status">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{feedback.text}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}
    </PageSection>
  );
}
