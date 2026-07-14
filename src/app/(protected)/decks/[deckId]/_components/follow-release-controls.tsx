'use client';

import type { getDeckFollowState, inspectReleaseChanges } from '@/db/queries/deck-release.queries';
import {
  forkReleaseAction,
  pinDeckReleaseAction,
  setAutomaticUpdatesAction,
} from '@/server/deck-release.actions';
import type { DeckRelease } from '@/types/deck-release.types';
import { Alert, Button, Chip, Label, ListBox, Select } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { isActionFailure } from '@/lib/action-result';

type FollowState = NonNullable<Awaited<ReturnType<typeof getDeckFollowState>>>;

type Operation = 'pin' | 'automatic' | 'fork';

type Feedback = {
  status: 'success' | 'danger';
  text: string;
};

type Props = {
  deckId: number;
  deckTitle: string;
  followState: FollowState;
  releases: DeckRelease[];
  releaseChanges: Awaited<ReturnType<typeof inspectReleaseChanges>> | null;
};

export default function FollowReleaseControls({
  deckId,
  deckTitle,
  followState,
  releases,
  releaseChanges,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [activeOperation, setActiveOperation] = useState<Operation | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const studied = followState.studiedRelease;

  function run(
    operationName: Exclude<Operation, 'fork'>,
    operation: () => Promise<unknown>,
    success: string,
  ) {
    setFeedback(null);
    setActiveOperation(operationName);

    startTransition(async () => {
      try {
        const result = await operation();
        if (isActionFailure(result)) {
          setFeedback({ status: 'danger', text: result.message });
          return;
        }

        setFeedback({
          status: 'success',
          text: success,
        });

        router.refresh();
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

  function makeCopy() {
    if (!studied) return;

    setFeedback(null);
    setActiveOperation('fork');

    startTransition(async () => {
      try {
        const forkId = await forkReleaseAction(studied.id, crypto.randomUUID());
        if (isActionFailure(forkId)) {
          setFeedback({ status: 'danger', text: forkId.message });
          return;
        }
        router.push(`/decks/${forkId}/edit`);
      } catch (error) {
        setFeedback({
          status: 'danger',
          text: error instanceof Error ? error.message : 'The copy could not be created.',
        });

        setActiveOperation(null);
      }
    });
  }

  return (
    <section
      className="w-full min-w-0 border-t border-default-200 pt-4"
      aria-label={`Release controls for ${deckTitle}`}
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">Deck updates</h2>
          <p className="text-sm text-default-500">
            {followState.updateMode === 'automatic'
              ? 'New changes from the author are applied automatically.'
              : 'You chose a specific version of this deck.'}
          </p>
        </div>

        <Chip
          size="sm"
          variant="soft"
          color={followState.updateAvailable ? 'warning' : 'default'}
          className="shrink-0 self-start"
        >
          {followState.updateAvailable
            ? 'Update available'
            : followState.updateMode === 'automatic'
              ? 'Up to date'
              : studied
                ? `Using version ${studied.version}`
                : 'No version selected'}
        </Chip>
      </div>

      {releaseChanges && followState.updateAvailable ? (
        <Alert status="default" className="mb-4">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Changes are ready</Alert.Title>
            <Alert.Description>
              {releaseChanges.addedVocabIds.length} added, {releaseChanges.changedVocabIds.length}{' '}
              changed, and {releaseChanges.removedVocabIds.length} removed.{' '}
              {releaseChanges.release.changeSummary}
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {followState.updateAvailable ? (
          <Button
            size="sm"
            variant="primary"
            className="w-full sm:w-auto"
            isPending={pending && activeOperation === 'automatic'}
            isDisabled={pending && activeOperation !== 'automatic'}
            onPress={() =>
              run(
                'automatic',
                () => setAutomaticUpdatesAction(deckId),
                'Deck updated. Future changes will be applied automatically.',
              )
            }
          >
            Update deck
          </Button>
        ) : null}

        {studied && studied.copyPolicy !== 'follow_only' ? (
          <Button
            size="sm"
            variant="secondary"
            className="w-full sm:w-auto"
            isPending={pending && activeOperation === 'fork'}
            isDisabled={pending && activeOperation !== 'fork'}
            onPress={makeCopy}
          >
            Make an editable copy
          </Button>
        ) : null}
      </div>

      <details className="mt-4 overflow-hidden rounded-lg border border-default-200 bg-default-50/50">
        <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-default-700">
          Advanced update settings
        </summary>
        <div className="space-y-3 border-t border-default-200 bg-background p-3">
          <Select
            className="min-w-0"
            value={studied?.id ?? null}
            isDisabled={pending || releases.length === 0}
            variant="secondary"
            onChange={value => {
              if (value === null || Array.isArray(value)) return;

              const releaseId = Number(value);

              if (!Number.isFinite(releaseId) || releaseId === studied?.id) return;

              run('pin', () => pinDeckReleaseAction(deckId, releaseId), 'Version selected.');
            }}
          >
            <Label>Version to study</Label>

            <Select.Trigger className="min-w-0">
              <Select.Value className="truncate" />
              <Select.Indicator />
            </Select.Trigger>

            <Select.Popover>
              <ListBox>
                {releases.map(release => {
                  const label = `Version ${release.version} · ${release.changeSummary}`;

                  return (
                    <ListBox.Item key={release.id} id={release.id} textValue={label}>
                      <span className="flex min-w-0 flex-col">
                        <span className="font-medium">Version {release.version}</span>
                        <span className="truncate text-sm text-default-500">
                          {release.changeSummary}
                        </span>
                      </span>

                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  );
                })}
              </ListBox>
            </Select.Popover>
          </Select>

          {followState.updateMode === 'manual' ? (
            <Button
              size="sm"
              variant="secondary"
              className="w-full sm:w-auto"
              isPending={pending && activeOperation === 'automatic'}
              isDisabled={pending && activeOperation !== 'automatic'}
              onPress={() =>
                run(
                  'automatic',
                  () => setAutomaticUpdatesAction(deckId),
                  'Automatic updates enabled.',
                )
              }
            >
              Use automatic updates
            </Button>
          ) : null}
        </div>
      </details>

      {feedback ? (
        <Alert status={feedback.status} className="mt-4" role="status">
          <Alert.Indicator />

          <Alert.Content>
            <Alert.Description>{feedback.text}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}
    </section>
  );
}
