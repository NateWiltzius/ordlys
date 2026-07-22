'use client';

import CreateVocabModal from '@/app/(protected)/decks/[deckId]/edit/_components/create-vocab-modal';
import EditLessonModal from '@/app/(protected)/decks/[deckId]/edit/_components/edit-lesson-modal';
import EditVocabModal from '@/app/(protected)/decks/[deckId]/edit/_components/edit-vocab-modal';
import MoveVocabModal from '@/app/(protected)/decks/[deckId]/edit/_components/move-vocab-modal';
import VocabularyLoading from '@/app/(protected)/decks/[deckId]/edit/_components/vocabulary-loading';
import VocabTable from '@/app/(protected)/decks/[deckId]/_components/vocab/vocab-table';
import ConfirmationDialog from '@/components/shared/confirmation-dialog';
import StatusAlert from '@/components/shared/status-alert';
import { moveItem, moveItemToIndex } from '@/lib/order/move-item';
import { deleteLessonAction } from '@/server/lesson.actions';
import {
  deleteVocabAction,
  getEditableLessonVocabularyAction,
  moveVocabAction,
  moveVocabToPositionAction,
} from '@/server/vocab.actions';
import { EditLessonSummary } from '@/types/lesson.types';
import { OrderDirection } from '@/types/order.types';
import { Vocab } from '@/types/vocab.types';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  NumberedListIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Accordion, Button, Chip, Tooltip } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { isActionFailure } from '@/lib/action-result';

type Props = {
  deckId: number;
  lesson: EditLessonSummary;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isLessonOrderPending: boolean;
  onMoveLesson: (lessonId: number, direction: OrderDirection) => void;
  isExpanded: boolean;
  onCardCountChange: (lessonId: number, cardCount: number) => void;
};

export default function LessonCard({
  deckId,
  lesson,
  canMoveUp,
  canMoveDown,
  isLessonOrderPending,
  onMoveLesson,
  isExpanded,
  onCardCountChange,
}: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [orderedVocabs, setOrderedVocabs] = useState<Vocab[] | null>(null);
  const [movingVocabId, setMovingVocabId] = useState<number | null>(null);
  const [deletingVocabId, setDeletingVocabId] = useState<number | null>(null);
  const [selectedVocab, setSelectedVocab] = useState<Vocab | null>(null);
  const [moveTarget, setMoveTarget] = useState<Vocab | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<'lesson' | Vocab | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const loadRequested = useRef(false);

  useEffect(() => {
    setOrderedVocabs(null);
    loadRequested.current = false;
  }, [lesson.id]);

  const loadVocabulary = useCallback(
    async (showLoading = true) => {
      if (showLoading) setIsLoading(true);
      setMutationError(null);

      try {
        setOrderedVocabs(await getEditableLessonVocabularyAction(deckId, lesson.id));
      } catch (error) {
        setMutationError(
          error instanceof Error ? error.message : 'Could not load this lesson’s vocabulary.',
        );
      } finally {
        if (showLoading) setIsLoading(false);
      }
    },
    [deckId, lesson.id],
  );

  useEffect(() => {
    if (!isExpanded) {
      loadRequested.current = false;
      return;
    }
    if (loadRequested.current || orderedVocabs !== null || isLoading) return;

    loadRequested.current = true;
    void loadVocabulary();
  }, [isExpanded, isLoading, loadVocabulary, orderedVocabs]);

  const handleDeleteLesson = async () => {
    if (isDeleting) return;

    try {
      setIsDeleting(true);
      setMutationError(null);
      const result = await deleteLessonAction(lesson.id);
      if (isActionFailure(result)) {
        setMutationError(result.message);
        return;
      }
      router.refresh();
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : 'Could not delete the lesson.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMoveVocab = async (vocabId: number, direction: OrderDirection) => {
    if (!orderedVocabs || movingVocabId !== null) return;

    const previousVocabs = orderedVocabs;
    const currentIndex = previousVocabs.findIndex(vocab => vocab.id === vocabId);
    const nextVocabs = moveItem(previousVocabs, currentIndex, direction);
    if (nextVocabs === previousVocabs) return;

    setOrderedVocabs(nextVocabs);
    setMovingVocabId(vocabId);
    setMutationError(null);

    try {
      const result = await moveVocabAction(vocabId, direction);
      if (isActionFailure(result)) {
        setOrderedVocabs(previousVocabs);
        setMutationError(result.message);
      }
    } catch (error) {
      setOrderedVocabs(previousVocabs);
      setMutationError(error instanceof Error ? error.message : 'Could not reorder vocabulary.');
    } finally {
      setMovingVocabId(null);
    }
  };

  const handleMoveVocabToPosition = async (
    vocabId: number,
    position: number,
  ): Promise<string | null> => {
    if (!orderedVocabs || movingVocabId !== null) return 'Another card is already being moved.';

    const previousVocabs = orderedVocabs;
    const currentIndex = previousVocabs.findIndex(vocab => vocab.id === vocabId);
    const nextVocabs = moveItemToIndex(previousVocabs, currentIndex, position - 1);
    if (nextVocabs === previousVocabs) return null;

    setOrderedVocabs(nextVocabs);
    setMovingVocabId(vocabId);
    setMutationError(null);

    try {
      const result = await moveVocabToPositionAction(vocabId, position);
      if (isActionFailure(result)) {
        setOrderedVocabs(previousVocabs);
        setMutationError(result.message);
        return result.message;
      }
      return null;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not reorder vocabulary.';
      setOrderedVocabs(previousVocabs);
      setMutationError(message);
      return message;
    } finally {
      setMovingVocabId(null);
    }
  };

  const handleDeleteVocab = async (vocab: Vocab) => {
    try {
      setDeletingVocabId(vocab.id);
      setMutationError(null);
      const result = await deleteVocabAction(vocab.id);
      if (isActionFailure(result)) {
        setMutationError(result.message);
        return;
      }
      setOrderedVocabs(current => current?.filter(item => item.id !== vocab.id) ?? null);
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : 'Could not delete vocabulary.');
    } finally {
      setDeletingVocabId(null);
    }
  };

  const vocabCount = orderedVocabs?.length ?? lesson.vocabCount;
  const lessonKey = String(lesson.id);

  useEffect(() => {
    onCardCountChange(lesson.id, vocabCount);
  }, [lesson.id, onCardCountChange, vocabCount]);

  return (
    <Accordion.Item id={lessonKey}>
      <Accordion.Heading>
        <Accordion.Trigger>
          <span className="flex min-w-0 flex-1 items-center justify-between gap-4 pr-2 text-left">
            <span className="min-w-0 break-words font-medium text-foreground">{lesson.title}</span>
            <Chip size="sm" variant="soft" className="shrink-0">
              {vocabCount} {vocabCount === 1 ? 'card' : 'cards'}
            </Chip>
          </span>
          <Accordion.Indicator />
        </Accordion.Trigger>
      </Accordion.Heading>

      <Accordion.Panel>
        <Accordion.Body>
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted">Manage the cards in this lesson.</p>
              <div className="flex flex-wrap items-center gap-1">
                <EditLessonModal lesson={lesson} />
                <Button
                  size="sm"
                  variant="tertiary"
                  isIconOnly
                  isDisabled={!canMoveUp || isLessonOrderPending}
                  aria-label={`Move ${lesson.title} up`}
                  onPress={() => onMoveLesson(lesson.id, 'up')}
                >
                  <ChevronUpIcon className="size-4" aria-hidden="true" />
                </Button>
                <Button
                  size="sm"
                  variant="tertiary"
                  isIconOnly
                  isDisabled={!canMoveDown || isLessonOrderPending}
                  aria-label={`Move ${lesson.title} down`}
                  onPress={() => onMoveLesson(lesson.id, 'down')}
                >
                  <ChevronDownIcon className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>

            {mutationError ? <StatusAlert status="danger">{mutationError}</StatusAlert> : null}

            {isLoading ? (
              <VocabularyLoading />
            ) : orderedVocabs ? (
              <VocabTable
                vocabs={orderedVocabs}
                emptyDescription="Add vocabulary to start building this lesson."
                renderActions={(vocab, index) => (
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="tertiary"
                      isIconOnly
                      aria-label={`Edit ${vocab.front}`}
                      onPress={() => setSelectedVocab(vocab)}
                    >
                      <PencilSquareIcon className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      size="sm"
                      variant="danger-soft"
                      isIconOnly
                      aria-label={`Delete ${vocab.front}`}
                      onPress={() => setDeleteTarget(vocab)}
                    >
                      <TrashIcon className="size-4" aria-hidden="true" />
                    </Button>
                    <Tooltip delay={300}>
                      <Button
                        size="sm"
                        variant="tertiary"
                        isIconOnly
                        isDisabled={orderedVocabs.length < 2 || movingVocabId !== null}
                        aria-label={`Move ${vocab.front} to another position`}
                        onPress={() => setMoveTarget(vocab)}
                      >
                        <NumberedListIcon className="size-4" aria-hidden="true" />
                      </Button>
                      <Tooltip.Content>Move to position</Tooltip.Content>
                    </Tooltip>
                    <Button
                      size="sm"
                      variant="tertiary"
                      isIconOnly
                      isDisabled={index === 0 || movingVocabId !== null}
                      aria-label={`Move ${vocab.front} up`}
                      onPress={() => handleMoveVocab(vocab.id, 'up')}
                    >
                      <ChevronUpIcon className="size-4" aria-hidden="true" />
                    </Button>
                    <Button
                      size="sm"
                      variant="tertiary"
                      isIconOnly
                      isDisabled={index === orderedVocabs.length - 1 || movingVocabId !== null}
                      aria-label={`Move ${vocab.front} down`}
                      onPress={() => handleMoveVocab(vocab.id, 'down')}
                    >
                      <ChevronDownIcon className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                )}
              />
            ) : (
              <Button variant="secondary" onPress={() => void loadVocabulary()}>
                Try loading again
              </Button>
            )}

            <div className="flex flex-wrap gap-2 border-t border-default-200 pt-4">
              <CreateVocabModal lessonId={lesson.id} onCreated={() => loadVocabulary(false)} />
              <Button
                size="sm"
                variant="danger-soft"
                isPending={isDeleting}
                onPress={() => setDeleteTarget('lesson')}
              >
                Delete lesson
              </Button>
            </div>

            <EditVocabModal
              vocab={selectedVocab}
              isOpen={selectedVocab !== null}
              onOpenChange={isOpen => {
                if (!isOpen) setSelectedVocab(null);
              }}
              onSaved={() => loadVocabulary(false)}
            />
            <MoveVocabModal
              vocab={moveTarget}
              currentPosition={
                moveTarget
                  ? (orderedVocabs?.findIndex(vocab => vocab.id === moveTarget.id) ?? -1) + 1
                  : 0
              }
              totalPositions={orderedVocabs?.length ?? 0}
              isOpen={moveTarget !== null}
              onOpenChange={isOpen => {
                if (!isOpen) setMoveTarget(null);
              }}
              onMove={position =>
                moveTarget
                  ? handleMoveVocabToPosition(moveTarget.id, position)
                  : Promise.resolve('Vocabulary is no longer available.')
              }
            />
            <ConfirmationDialog
              isOpen={deleteTarget !== null}
              onOpenChange={isOpen => {
                if (!isOpen && !isDeleting && deletingVocabId === null) setDeleteTarget(null);
              }}
              title={
                deleteTarget === 'lesson'
                  ? `Delete lesson “${lesson.title}”?`
                  : `Delete “${deleteTarget?.front ?? ''}”?`
              }
              description={
                deleteTarget === 'lesson'
                  ? 'The lesson and all of its vocabulary will be deleted.'
                  : 'This vocabulary item will be permanently deleted. This cannot be undone.'
              }
              confirmLabel={deleteTarget === 'lesson' ? 'Delete lesson' : 'Delete vocabulary'}
              isPending={isDeleting || deletingVocabId !== null}
              onConfirm={async () => {
                const target = deleteTarget;
                if (target === 'lesson') await handleDeleteLesson();
                else if (target) await handleDeleteVocab(target);
                setDeleteTarget(null);
              }}
            />
          </div>
        </Accordion.Body>
      </Accordion.Panel>
    </Accordion.Item>
  );
}
