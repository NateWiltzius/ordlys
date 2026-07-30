'use client';

import type { DeckProvenance } from '@/db/queries/deck-release.queries';
import {
  archiveDeckAction,
  changeDeckCopyPolicyAction,
  changeDeckVisibilityAction,
  softDeleteDeckAction,
} from '@/server/deck-release.actions';
import type { DeckRelease } from '@/types/deck-release.types';
import type { Deck } from '@/types/deck.types';
import ConfirmationDialog from '@/components/shared/confirmation-dialog';
import { Alert, Button, Chip, Description, Label, ListBox, Select } from '@heroui/react';
import { useState } from 'react';
import type {
  PublicationOperation,
  usePublicationActions,
} from '@/app/(protected)/decks/[deckId]/edit/_components/use-publication-actions';

const visibilityOptions = [
  { id: 'private', label: 'Private' },
  { id: 'unlisted', label: 'Unlisted' },
  { id: 'public', label: 'Public' },
] as const;

const copyPolicyOptions = [
  { id: 'follow_only', label: 'No copies' },
  { id: 'private_forks', label: 'Private copies' },
  { id: 'public_forks', label: 'Public copies' },
] as const;

type RunPublicationOperation = ReturnType<typeof usePublicationActions>['run'];

type SharedProps = {
  deck: Deck;
  pending: boolean;
  run: RunPublicationOperation;
};

export function DeckVisibilitySetting({
  deck,
  provenance,
  currentRelease,
  pending,
  run,
}: SharedProps & {
  provenance: DeckProvenance | null;
  currentRelease: DeckRelease | undefined;
}) {
  const sourceAllowsPublicForks = provenance?.sourceCopyPolicy === 'public_forks';

  return (
    <Select
      aria-label="Who can find this deck?"
      value={deck.visibility}
      isDisabled={pending || !currentRelease}
      variant="secondary"
      fullWidth
      onChange={value => {
        if (value === null || Array.isArray(value)) return;
        run(
          'visibility',
          () =>
            changeDeckVisibilityAction(deck.id, String(value) as 'private' | 'unlisted' | 'public'),
          'Visibility updated.',
        );
      }}
    >
      <Label>Who can find this deck?</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Description>
        {currentRelease
          ? provenance && !sourceAllowsPublicForks
            ? 'The original deck requires this copy to remain private.'
            : 'Private is only visible to you; unlisted requires a link; public appears in discovery.'
          : 'Publish the first version before changing who can find this deck.'}
      </Description>
      <Select.Popover>
        <ListBox>
          {visibilityOptions.map(option => (
            <ListBox.Item
              key={option.id}
              id={option.id}
              textValue={option.label}
              isDisabled={Boolean(
                provenance && option.id !== 'private' && !sourceAllowsPublicForks,
              )}
            >
              {option.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

export function DeckCopyPolicySetting({
  deck,
  provenance,
  pending,
  run,
}: SharedProps & { provenance: DeckProvenance | null }) {
  const sourcePolicyRank = provenance
    ? copyPolicyOptions.findIndex(option => option.id === provenance.sourceCopyPolicy)
    : copyPolicyOptions.length - 1;

  return (
    <>
      {provenance ? (
        <Alert status="default" className="mb-4">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Original deck</Alert.Title>
            <Alert.Description>
              This deck began as a copy of “{provenance.sourceTitle}” version{' '}
              {provenance.sourceVersion}.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}
      <Select
        aria-label="Can other learners copy this deck?"
        value={deck.copyPolicy}
        isDisabled={pending}
        variant="secondary"
        fullWidth
        onChange={value => {
          if (value === null || Array.isArray(value)) return;
          run(
            'copyPolicy',
            () =>
              changeDeckCopyPolicyAction(
                deck.id,
                String(value) as 'follow_only' | 'private_forks' | 'public_forks',
              ),
            'Copying preference updated.',
          );
        }}
      >
        <Label>Can other learners copy this deck?</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Description>
          {provenance
            ? 'This cannot be more permissive than the original deck.'
            : 'Changes apply the next time you publish.'}
        </Description>
        <Select.Popover>
          <ListBox>
            {copyPolicyOptions.map(option => (
              <ListBox.Item
                key={option.id}
                id={option.id}
                textValue={option.label}
                isDisabled={
                  Boolean(provenance) &&
                  copyPolicyOptions.findIndex(candidate => candidate.id === option.id) >
                    sourcePolicyRank
                }
              >
                {option.label}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
    </>
  );
}

export function PublicationHistory({
  releases,
  currentReleaseId,
}: {
  releases: DeckRelease[];
  currentReleaseId: number | null;
}) {
  if (releases.length === 0) {
    return (
      <section>
        <h3 className="text-sm font-semibold">Release history</h3>
        <p className="mt-1 text-sm text-default-500">Your published versions will appear here.</p>
      </section>
    );
  }

  return (
    <section>
      <h3 className="text-sm font-semibold">Release history</h3>
      <ol className="mt-3 divide-y divide-default-200 overflow-hidden rounded-lg border border-default-200">
        {releases.map(release => (
          <li
            key={release.id}
            className="flex flex-col gap-1 bg-content1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">Version {release.version}</span>
                {release.id === currentReleaseId ? (
                  <Chip size="sm" variant="soft">
                    Current
                  </Chip>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-default-600">{release.changeSummary}</p>
            </div>
            <time
              className="shrink-0 text-xs text-default-500"
              dateTime={release.createdAt.toISOString()}
            >
              {release.createdAt.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </time>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function DeckLifecycleActions({
  deckId,
  pending,
  activeOperation,
  run,
}: {
  deckId: number;
  pending: boolean;
  activeOperation: PublicationOperation | null;
  run: RunPublicationOperation;
}) {
  const [confirmation, setConfirmation] = useState<'archive' | 'delete' | null>(null);
  const isArchiving = pending && activeOperation === 'archive';
  const isDeleting = pending && activeOperation === 'delete';

  return (
    <section className="space-y-3 border-t border-default-200 pt-5">
      <div>
        <h3 className="text-sm font-semibold">Deck lifecycle</h3>
        <p className="mt-1 text-sm text-default-500">
          Archive a deck temporarily or move it to deleted decks.
        </p>
      </div>
      <div className="flex flex-col gap-2 min-[420px]:flex-row">
        <Button
          variant="secondary"
          className="w-full min-[420px]:w-auto"
          isDisabled={pending}
          onPress={() => setConfirmation('archive')}
        >
          Archive deck
        </Button>
        <Button
          variant="danger"
          className="w-full min-[420px]:w-auto"
          isDisabled={pending}
          onPress={() => setConfirmation('delete')}
        >
          Delete deck
        </Button>
      </div>

      <ConfirmationDialog
        isOpen={confirmation === 'archive'}
        onOpenChange={isOpen => setConfirmation(isOpen ? 'archive' : null)}
        title="Archive this deck?"
        description="The deck will be hidden from your active decks. You can restore it later from archived decks."
        confirmLabel="Archive deck"
        tone="warning"
        isPending={isArchiving}
        onConfirm={() =>
          run(
            'archive',
            () => archiveDeckAction(deckId),
            'Deck archived.',
            true,
            () => setConfirmation(null),
          )
        }
      />

      <ConfirmationDialog
        isOpen={confirmation === 'delete'}
        onOpenChange={isOpen => setConfirmation(isOpen ? 'delete' : null)}
        title="Move this deck to deleted decks?"
        description="The deck will no longer be available to learners. You can restore it during the retention period."
        confirmLabel="Delete deck"
        tone="danger"
        isPending={isDeleting}
        onConfirm={() =>
          run(
            'delete',
            () => softDeleteDeckAction(deckId),
            'Deck moved to deleted decks.',
            true,
            () => setConfirmation(null),
          )
        }
      />
    </section>
  );
}
