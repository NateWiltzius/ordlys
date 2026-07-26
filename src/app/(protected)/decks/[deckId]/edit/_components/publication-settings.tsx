import type { DeckProvenance } from '@/db/queries/deck-release.queries';
import {
  archiveDeckAction,
  changeDeckCopyPolicyAction,
  changeDeckVisibilityAction,
  softDeleteDeckAction,
} from '@/server/deck-release.actions';
import type { DeckRelease } from '@/types/deck-release.types';
import type { Deck } from '@/types/deck.types';
import { Alert, Button, Description, Label, ListBox, Select } from '@heroui/react';
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
          : 'Available after you publish the deck.'}
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
        <Alert status="default">
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

export function PublicationHistory({ releases }: { releases: DeckRelease[] }) {
  if (releases.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold">Published versions</h3>
      <ol className="mt-2 space-y-2 text-sm">
        {releases.map(release => (
          <li key={release.id} className="flex items-start justify-between gap-4 text-default-600">
            <span>
              Version {release.version} · {release.changeSummary}
            </span>
            <time className="shrink-0" dateTime={release.createdAt.toISOString()}>
              {release.createdAt.toLocaleDateString()}
            </time>
          </li>
        ))}
      </ol>
    </div>
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
  return (
    <div className="space-y-3 border-t border-default-200 pt-4">
      <div>
        <h3 className="text-sm font-semibold">Deck status</h3>
        <p className="text-sm text-default-500">
          Archive a deck temporarily or move it to deleted decks.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          isPending={pending && activeOperation === 'archive'}
          isDisabled={pending && activeOperation !== 'archive'}
          onPress={() => run('archive', () => archiveDeckAction(deckId), 'Deck archived.', true)}
        >
          Archive deck
        </Button>
        <Button
          variant="danger"
          isPending={pending && activeOperation === 'delete'}
          isDisabled={pending && activeOperation !== 'delete'}
          onPress={() =>
            run('delete', () => softDeleteDeckAction(deckId), 'Deck moved to deleted decks.', true)
          }
        >
          Delete deck
        </Button>
      </div>
    </div>
  );
}
