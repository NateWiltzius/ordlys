'use client';

import type { DeckProvenance } from '@/db/queries/deck-release.queries';
import {
  archiveDeckAction,
  changeDeckCopyPolicyAction,
  changeDeckVisibilityAction,
  publishDeckAction,
  softDeleteDeckAction,
} from '@/server/deck-release.actions';
import type { DeckRelease } from '@/types/deck-release.types';
import type { Deck } from '@/types/deck.types';
import { isActionFailure } from '@/lib/action-result';
import {
  Alert,
  Button,
  Card,
  Chip,
  Description,
  Input,
  Label,
  ListBox,
  Select,
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

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

type Operation = 'publish' | 'visibility' | 'copyPolicy' | 'archive' | 'delete';

type Feedback = {
  status: 'success' | 'danger';
  text: string;
};

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
  const router = useRouter();
  const [summary, setSummary] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [activeOperation, setActiveOperation] = useState<Operation | null>(null);
  const [pending, startTransition] = useTransition();

  const current = releases.find(release => release.id === deck.currentReleaseId);
  const sourceAllowsPublicForks = provenance?.sourceCopyPolicy === 'public_forks';
  const sourcePolicyRank = provenance
    ? copyPolicyOptions.findIndex(option => option.id === provenance.sourceCopyPolicy)
    : copyPolicyOptions.length - 1;

  function run(
    operationName: Operation,
    operation: () => Promise<unknown>,
    success: string,
    leavePage = false,
  ) {
    setFeedback(null);
    setActiveOperation(operationName);

    startTransition(async () => {
      try {
        const result = await operation();

        if (isActionFailure(result)) {
          setFeedback({
            status: 'danger',
            text: result.message,
          });
          return;
        }

        setFeedback({
          status: 'success',
          text: success,
        });

        if (leavePage) {
          router.push('/decks');
        } else {
          router.refresh();
        }
      } catch (error) {
        setFeedback({
          status: 'danger',
          text: error instanceof Error ? error.message : 'The operation could not be completed.',
        });
      } finally {
        setActiveOperation(null);
      }
    });
  }

  return (
    <Card>
      <Card.Header className="flex-col items-start gap-2 sm:flex-row sm:justify-between">
        <div>
          <Card.Title>Publishing</Card.Title>
          <Card.Description>
            Publish changes when you are ready to share them. Your edits stay private until then.
          </Card.Description>
        </div>

        <Chip size="sm" variant="soft">
          {current
            ? hasUnpublishedChanges
              ? 'Changes ready to publish'
              : 'Published'
            : 'Private draft'}
        </Chip>
      </Card.Header>

      <Card.Content className="space-y-5">
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
            isDisabled={!hasUnpublishedChanges && Boolean(current)}
            onPress={() =>
              run(
                'publish',
                () =>
                  publishDeckAction(
                    deck.id,
                    summary.trim() || (current ? 'Updated deck' : 'Initial release'),
                    crypto.randomUUID(),
                  ),
                'Changes published.',
              )
            }
          >
            {current ? 'Publish changes' : 'Publish deck'}
          </Button>
        </div>

        {!current ? (
          <p className="rounded-lg border border-default-200 bg-default-50 px-4 py-3 text-sm text-default-600">
            Publish this deck before making it available to other learners.
          </p>
        ) : null}

        <Select
          value={deck.visibility}
          isDisabled={pending || !current}
          variant="secondary"
          fullWidth
          onChange={value => {
            if (value === null || Array.isArray(value)) return;

            run(
              'visibility',
              () =>
                changeDeckVisibilityAction(
                  deck.id,
                  String(value) as 'private' | 'unlisted' | 'public',
                ),
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
            {current
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

        <details className="overflow-hidden rounded-xl border border-default-200 bg-default-50/50">
          <summary className="cursor-pointer px-4 py-3 font-medium text-default-700">
            Advanced publishing settings
          </summary>
          <div className="space-y-5 border-t border-default-200 bg-background p-4">
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

            {releases.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold">Published versions</h3>
                <ol className="mt-2 space-y-2 text-sm">
                  {releases.map(release => (
                    <li
                      key={release.id}
                      className="flex items-start justify-between gap-4 text-default-600"
                    >
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
            ) : null}

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
                  onPress={() =>
                    run('archive', () => archiveDeckAction(deck.id), 'Deck archived.', true)
                  }
                >
                  Archive deck
                </Button>

                <Button
                  variant="danger"
                  isPending={pending && activeOperation === 'delete'}
                  isDisabled={pending && activeOperation !== 'delete'}
                  onPress={() =>
                    run(
                      'delete',
                      () => softDeleteDeckAction(deck.id),
                      'Deck moved to deleted decks.',
                      true,
                    )
                  }
                >
                  Delete deck
                </Button>
              </div>
            </div>
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
      </Card.Content>
    </Card>
  );
}
