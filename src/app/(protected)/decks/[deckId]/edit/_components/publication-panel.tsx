'use client';

import type { DeckProvenance } from '@/db/queries/deck-release.queries';
import { publishDeckAction } from '@/server/deck-release.actions';
import type { DeckRelease } from '@/types/deck-release.types';
import type { Deck } from '@/types/deck.types';
import PageSection from '@/components/shared/layout/page-section';
import { CheckCircleIcon, CloudArrowUpIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { Alert, Button, Chip, Label, Modal, TextArea } from '@heroui/react';
import { useRef, useState } from 'react';
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
  lessonCount: number;
  cardCount: number;
};

const visibilityLabels = {
  private: 'Private',
  unlisted: 'Unlisted',
  public: 'Public',
} as const;

export default function PublicationPanel({
  deck,
  releases,
  hasUnpublishedChanges,
  provenance,
  lessonCount,
  cardCount,
}: Props) {
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [summary, setSummary] = useState('');
  const publishRequestId = useRef<string | null>(null);
  const { activeOperation, feedback, pending, run } = usePublicationActions();
  const currentRelease = releases.find(release => release.id === deck.currentReleaseId);
  const canPublish = !currentRelease || hasUnpublishedChanges;
  const nextVersion = (currentRelease?.version ?? 0) + 1;
  const isPublishing = pending && activeOperation === 'publish';

  const openReview = () => {
    setSummary(currentRelease ? '' : 'Initial release');
    publishRequestId.current = null;
    setIsReviewOpen(true);
  };

  const handleReviewOpenChange = (isOpen: boolean) => {
    if (isPublishing) return;
    setIsReviewOpen(isOpen);
    if (!isOpen) {
      setSummary('');
      publishRequestId.current = null;
    }
  };

  const publish = () => {
    const changeSummary = summary.trim();
    if (!changeSummary || isPublishing) return;

    publishRequestId.current ??= crypto.randomUUID();
    const requestId = publishRequestId.current;
    run(
      'publish',
      () => publishDeckAction(deck.id, changeSummary, requestId),
      `Version ${nextVersion} published.`,
      false,
      () => {
        setIsReviewOpen(false);
        setSummary('');
        publishRequestId.current = null;
      },
    );
  };

  const state = currentRelease
    ? hasUnpublishedChanges
      ? {
          chip: 'Unpublished changes',
          title: 'Changes are ready for review',
          description: `Publishing creates version ${nextVersion}. Learners keep using version ${currentRelease.version} until you publish.`,
        }
      : {
          chip: 'Up to date',
          title: `Version ${currentRelease.version} is live`,
          description:
            'Your published version matches the current draft. Make a content change before publishing again.',
        }
    : {
        chip: 'Private draft',
        title: 'Ready for a first release',
        description:
          'Publishing creates a stable version for learners. The deck stays private until you change its sharing setting.',
      };

  return (
    <>
      <PageSection
        title="Publishing"
        description="Create stable releases, then choose who can find and use them."
        action={
          <Chip size="sm" variant="soft">
            {state.chip}
          </Chip>
        }
        contentClassName="space-y-6"
      >
        <section className="rounded-xl border border-default-200 p-4 sm:p-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                {currentRelease && !hasUnpublishedChanges ? (
                  <CheckCircleIcon className="size-6" aria-hidden="true" />
                ) : (
                  <CloudArrowUpIcon className="size-6" aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0">
                <h3 className="font-semibold text-default-900">{state.title}</h3>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-default-600">
                  {state.description}
                </p>
              </div>
            </div>
            <Button
              className="w-full shrink-0 sm:w-auto"
              isDisabled={!canPublish || pending}
              onPress={openReview}
            >
              {canPublish ? `Review version ${nextVersion}` : 'No changes to publish'}
            </Button>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-default-200 pt-5 sm:grid-cols-4">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-default-500">
                Next release
              </dt>
              <dd className="mt-1 text-sm font-semibold">Version {nextVersion}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-default-500">
                Lessons
              </dt>
              <dd className="mt-1 text-sm font-semibold">{lessonCount}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-default-500">
                Cards
              </dt>
              <dd className="mt-1 text-sm font-semibold">{cardCount}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-default-500">
                Visibility
              </dt>
              <dd className="mt-1 text-sm font-semibold">{visibilityLabels[deck.visibility]}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-default-200 p-4 sm:p-5">
          <div className="mb-4 flex gap-3">
            <GlobeAltIcon className="mt-0.5 size-5 shrink-0 text-default-500" aria-hidden="true" />
            <div>
              <h3 className="font-semibold">Sharing</h3>
              <p className="mt-1 text-sm text-default-500">
                Publishing creates a release. Sharing controls who can find it.
              </p>
            </div>
          </div>
          <DeckVisibilitySetting
            deck={deck}
            provenance={provenance}
            currentRelease={currentRelease}
            pending={pending}
            run={run}
          />
        </section>

        <details className="overflow-hidden rounded-xl border border-default-200 bg-default-50/50">
          <summary className="cursor-pointer px-4 py-3 font-medium text-default-700">
            Advanced publishing settings
          </summary>
          <div className="space-y-6 border-t border-default-200 bg-background p-4 sm:p-5">
            <section>
              <h3 className="mb-3 text-sm font-semibold">Copying</h3>
              <DeckCopyPolicySetting
                deck={deck}
                provenance={provenance}
                pending={pending}
                run={run}
              />
            </section>
            <PublicationHistory releases={releases} currentReleaseId={deck.currentReleaseId} />
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

      <Modal.Backdrop
        isOpen={isReviewOpen}
        onOpenChange={handleReviewOpenChange}
        isDismissable={!isPublishing}
        isKeyboardDismissDisabled={isPublishing}
      >
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-xl">
            <Modal.CloseTrigger />
            <Modal.Header className="space-y-1">
              <Modal.Heading>Review version {nextVersion}</Modal.Heading>
              <p className="text-sm text-default-500">
                Confirm the release contents and leave a useful note for learners.
              </p>
            </Modal.Header>
            <Modal.Body className="space-y-5">
              <div className="rounded-xl border border-default-200 bg-default-50 p-4">
                <p className="font-semibold text-default-900">{deck.title}</p>
                <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <dt className="text-default-500">Version</dt>
                    <dd className="font-medium">{nextVersion}</dd>
                  </div>
                  <div>
                    <dt className="text-default-500">Lessons</dt>
                    <dd className="font-medium">{lessonCount}</dd>
                  </div>
                  <div>
                    <dt className="text-default-500">Cards</dt>
                    <dd className="font-medium">{cardCount}</dd>
                  </div>
                </dl>
              </div>

              <div className="form-field">
                <Label htmlFor={`release-note-${deck.id}`}>Release note</Label>
                <TextArea
                  id={`release-note-${deck.id}`}
                  value={summary}
                  onChange={event => setSummary(event.target.value)}
                  placeholder="Summarize what learners should know"
                  variant="secondary"
                  maxLength={2000}
                  rows={3}
                  autoFocus
                  fullWidth
                />
                <p className="text-xs text-default-500">
                  This note appears in the deck’s version history.
                </p>
              </div>

              <Alert status={deck.visibility === 'private' ? 'default' : 'warning'}>
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>
                    {deck.visibility === 'private'
                      ? 'This release will stay private'
                      : `This deck is ${visibilityLabels[deck.visibility].toLowerCase()}`}
                  </Alert.Title>
                  <Alert.Description>
                    {deck.visibility === 'private'
                      ? 'Only you can access it until you change the sharing setting.'
                      : 'Publishing will update the version available to learners.'}
                  </Alert.Description>
                </Alert.Content>
              </Alert>
            </Modal.Body>
            <Modal.Footer className="flex-col-reverse items-stretch gap-2 min-[560px]:flex-row min-[560px]:items-center min-[560px]:justify-end">
              <Button
                variant="tertiary"
                className="w-full min-[560px]:w-auto"
                isDisabled={isPublishing}
                onPress={() => handleReviewOpenChange(false)}
              >
                Keep editing
              </Button>
              <Button
                className="w-full min-[560px]:w-auto"
                isPending={isPublishing}
                isDisabled={!summary.trim()}
                onPress={publish}
              >
                Publish version {nextVersion}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
