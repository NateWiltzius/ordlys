'use client';

import CreateVocabModal from '@/app/(protected)/decks/[deckId]/edit/_components/create-vocab-modal';
import EditLessonModal from '@/app/(protected)/decks/[deckId]/edit/_components/edit-lesson-modal';
import EditVocabModal from '@/app/(protected)/decks/[deckId]/edit/_components/edit-vocab-modal';
import VocabTable from '@/app/(protected)/decks/[deckId]/_components/vocab/vocab-table';
import ConfirmationDialog from '@/components/shared/confirmation-dialog';
import { SkeletonLine } from '@/components/shared/skeleton';
import StatusAlert from '@/components/shared/status-alert';
import { moveItem } from '@/lib/order/move-item';
import { deleteLessonAction } from '@/server/lesson.actions';
import {
  deleteVocabAction,
  getEditableLessonVocabularyAction,
  moveVocabAction,
} from '@/server/vocab.actions';
import { EditLessonSummary } from '@/types/lesson.types';
import { OrderDirection } from '@/types/order.types';
import { Vocab } from '@/types/vocab.types';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Button, Card, Chip } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { isActionFailure } from '@/lib/action-result';

type Props = {
  deckId: number;
  lesson: EditLessonSummary;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isLessonOrderPending: boolean;
  onMoveLesson: (lessonId: number, direction: OrderDirection) => void;
};

export default function LessonCard({
  deckId,
  lesson,
  canMoveUp,
  canMoveDown,
  isLessonOrderPending,
  onMoveLesson,
}: Props) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [orderedVocabs, setOrderedVocabs] = useState<Vocab[] | null>(null);
  const [movingVocabId, setMovingVocabId] = useState<number | null>(null);
  const [deletingVocabId, setDeletingVocabId] = useState<number | null>(null);
  const [selectedVocab, setSelectedVocab] = useState<Vocab | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<'lesson' | Vocab | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  useEffect(() => {
    setOrderedVocabs(null);
    setIsExpanded(false);
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

  const handleToggle = () => {
    const nextExpanded = !isExpanded;
    setIsExpanded(nextExpanded);
    if (nextExpanded && orderedVocabs === null && !isLoading) void loadVocabulary();
  };

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
  const contentId = `lesson-editor-${lesson.id}`;

  return (
    <Card variant="secondary" className="border border-default-200 shadow-none">
      <Card.Header className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Card.Title className="text-base">{lesson.title}</Card.Title>
          <Card.Description>
            {isExpanded
              ? 'Manage the words in this lesson.'
              : 'Expand to load and edit vocabulary.'}
          </Card.Description>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <EditLessonModal lesson={lesson} />
          <Chip size="sm" variant="soft">
            {vocabCount} {vocabCount === 1 ? 'word' : 'words'}
          </Chip>
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
          <Button
            size="sm"
            variant="secondary"
            aria-expanded={isExpanded}
            aria-controls={contentId}
            onPress={handleToggle}
          >
            {isExpanded ? 'Collapse' : 'Edit words'}
            <ChevronDownIcon
              className={`size-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </Button>
        </div>
      </Card.Header>

      {isExpanded ? (
        <>
          <Card.Content id={contentId} className="space-y-3 border-t border-default-200 p-4">
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
          </Card.Content>

          <Card.Footer className="flex flex-wrap gap-2 border-t border-default-200 p-4">
            <CreateVocabModal lessonId={lesson.id} onCreated={() => loadVocabulary(false)} />
            <Button
              size="sm"
              variant="danger-soft"
              isPending={isDeleting}
              onPress={() => setDeleteTarget('lesson')}
            >
              Delete lesson
            </Button>
          </Card.Footer>

          <EditVocabModal
            vocab={selectedVocab}
            isOpen={selectedVocab !== null}
            onOpenChange={isOpen => {
              if (!isOpen) setSelectedVocab(null);
            }}
            onSaved={() => loadVocabulary(false)}
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
        </>
      ) : null}
    </Card>
  );
}

function VocabularyLoading() {
  return (
    <div className="space-y-3 rounded-xl border border-default-200 p-4" aria-hidden="true">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="grid gap-3 sm:grid-cols-3">
          <SkeletonLine className="h-4 w-2/3" />
          <SkeletonLine className="h-4 w-3/4" />
          <SkeletonLine className="h-8 w-32 sm:ml-auto" />
        </div>
      ))}
    </div>
  );
}
