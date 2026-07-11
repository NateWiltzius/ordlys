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
  Separator,
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

const visibilityOptions = [
  { id: 'private', label: 'Private' },
  { id: 'unlisted', label: 'Unlisted' },
  { id: 'public', label: 'Public' },
] as const;

const copyPolicyOptions = [
  { id: 'follow_only', label: 'Following only' },
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
        await operation();

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
          <Card.Title>Draft and published content</Card.Title>
          <Card.Description>
            Draft edits remain private until you publish an immutable release.
          </Card.Description>
        </div>

        <Chip size="sm" variant="soft">
          {current
            ? `Published v${current.version}${
                hasUnpublishedChanges ? ' · draft changes' : ' · up to date'
              }`
            : 'Unpublished draft'}
        </Chip>
      </Card.Header>

      <Card.Content className="space-y-5">
        {provenance ? (
          <Alert status="default">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Fork provenance</Alert.Title>
              <Alert.Description>
                Forked from “{provenance.sourceTitle}” v{provenance.sourceVersion}. Root lineage: “
                {provenance.rootTitle}”. Provenance is immutable.
              </Alert.Description>
            </Alert.Content>
          </Alert>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1">
            <Label htmlFor={`change-summary-${deck.id}`}>Change summary</Label>

            <Input
              id={`change-summary-${deck.id}`}
              value={summary}
              onChange={event => setSummary(event.target.value)}
              placeholder="What changed in this release?"
              variant="secondary"
              fullWidth
            />
          </div>

          <Button
            isPending={pending && activeOperation === 'publish'}
            isDisabled={!summary.trim() || (!hasUnpublishedChanges && Boolean(current))}
            onPress={() =>
              run(
                'publish',
                () => publishDeckAction(deck.id, summary.trim(), crypto.randomUUID()),
                'The draft was published.',
              )
            }
          >
            {current ? 'Publish update' : 'Publish release'}
          </Button>
        </div>

        <Separator />

        <div className="grid gap-4 md:grid-cols-2">
          <Select
            value={deck.visibility}
            isDisabled={pending}
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
            <Label>Visibility</Label>

            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>

            <Description>Controls who can discover and access this deck.</Description>

            <Select.Popover>
              <ListBox>
                {visibilityOptions.map(option => (
                  <ListBox.Item key={option.id} id={option.id} textValue={option.label}>
                    {option.label}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

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
                'Copy policy updated.',
              );
            }}
          >
            <Label>Copy policy</Label>

            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>

            <Description>
              Controls whether other users can fork this deck. Changes take effect only after you
              publish the next release.
            </Description>

            <Select.Popover>
              <ListBox>
                {copyPolicyOptions.map(option => (
                  <ListBox.Item key={option.id} id={option.id} textValue={option.label}>
                    {option.label}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>

        {releases.length > 0 ? (
          <>
            <Separator />

            <div>
              <h3 className="text-sm font-semibold">Release history</h3>

              <ol className="mt-2 space-y-2 text-sm">
                {releases.map(release => (
                  <li
                    key={release.id}
                    className="flex items-start justify-between gap-4 text-default-600"
                  >
                    <span>
                      v{release.version} · {release.changeSummary}
                    </span>

                    <time className="shrink-0" dateTime={release.createdAt.toISOString()}>
                      {release.createdAt.toLocaleDateString()}
                    </time>
                  </li>
                ))}
              </ol>
            </div>
          </>
        ) : null}

        <Separator />

        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            isPending={pending && activeOperation === 'archive'}
            isDisabled={pending && activeOperation !== 'archive'}
            onPress={() => run('archive', () => archiveDeckAction(deck.id), 'Deck archived.', true)}
          >
            Archive deck
          </Button>

          <Button
            variant="danger"
            isPending={pending && activeOperation === 'delete'}
            isDisabled={pending && activeOperation !== 'delete'}
            onPress={() =>
              run('delete', () => softDeleteDeckAction(deck.id), 'Deck deleted.', true)
            }
          >
            Delete deck
          </Button>
        </div>

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
