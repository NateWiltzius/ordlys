'use client';

import CreateVocabModal from './create-vocab-modal';
import BulkCreateVocabModal from './bulk-create-vocab-modal';
import EditVocabModal from './edit-vocab-modal';
import MoveVocabModal from './move-vocab-modal';
import VocabularyLoading from './vocabulary-loading';
import { useLessonCardController } from './use-lesson-card-controller';
import { LessonToolbar, VocabActions, VocabReorderActions } from './lesson-card-controls';
import VocabTable from '@/app/(protected)/decks/[deckId]/_components/vocab/vocab-table';
import ConfirmationDialog from '@/components/shared/confirmation-dialog';
import StatusAlert from '@/components/shared/status-alert';
import type { EditLessonSummary } from '@/types/lesson.types';
import type { OrderDirection } from '@/types/order.types';
import { Button, Chip } from '@heroui/react';
import { useEffect, useState } from 'react';

type Props = {
  deckId: number;
  lesson: EditLessonSummary;
  lessonPosition: number;
  lessonTotal: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isLessonOrderPending: boolean;
  onMoveLesson: (lessonId: number, direction: OrderDirection) => void;
  isActive: boolean;
  onCardCountChange: (lessonId: number, cardCount: number) => void;
  focusedVocabId?: number | null;
};

export default function LessonEditor({
  deckId,
  lesson,
  lessonPosition,
  lessonTotal,
  canMoveUp,
  canMoveDown,
  isLessonOrderPending,
  onMoveLesson,
  isActive,
  onCardCountChange,
  focusedVocabId,
}: Props) {
  const controller = useLessonCardController({
    deckId,
    lesson,
    isActive,
    onCardCountChange,
  });
  const [isReordering, setIsReordering] = useState(false);
  const [recentlyMovedVocabId, setRecentlyMovedVocabId] = useState<number | null>(null);
  const [reorderAnnouncement, setReorderAnnouncement] = useState('');
  const vocabCount = controller.orderedVocabs?.length ?? lesson.vocabCount;
  const highlightedVocabId = focusedVocabId ?? recentlyMovedVocabId;
  const selectedVocabIndex =
    controller.selectedVocab && controller.orderedVocabs
      ? controller.orderedVocabs.findIndex(vocab => vocab.id === controller.selectedVocab?.id)
      : -1;

  useEffect(() => {
    if (!isActive || !highlightedVocabId || !controller.orderedVocabs) return;

    const frame = requestAnimationFrame(() => {
      const card = document.getElementById(`vocab-card-${highlightedVocabId}`);
      card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [controller.orderedVocabs, highlightedVocabId, isActive]);

  useEffect(() => {
    if (!recentlyMovedVocabId) return;
    const timeout = window.setTimeout(() => setRecentlyMovedVocabId(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [recentlyMovedVocabId]);

  const moveCard = async (
    vocabId: number,
    vocabFront: string,
    index: number,
    direction: OrderDirection,
  ) => {
    setRecentlyMovedVocabId(vocabId);
    const didMove = await controller.moveVocab(vocabId, direction);
    if (!didMove) {
      setRecentlyMovedVocabId(null);
      return;
    }

    const nextPosition = direction === 'up' ? index : index + 2;
    setReorderAnnouncement(`${vocabFront} moved to position ${nextPosition}.`);
  };

  return (
    <section
      aria-labelledby={`lesson-editor-${lesson.id}-title`}
      className="overflow-hidden rounded-xl border border-default-200 bg-background"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-default-200 bg-default-50/60 px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Lesson</p>
          <h3
            id={`lesson-editor-${lesson.id}-title`}
            className="mt-0.5 break-words font-semibold text-foreground"
          >
            {lesson.title}
          </h3>
        </div>
        <Chip size="sm" variant="soft" className="shrink-0">
          {vocabCount} {vocabCount === 1 ? 'card' : 'cards'}
        </Chip>
      </header>

      <div className="space-y-4 p-4">
        <LessonToolbar
          lesson={lesson}
          lessonPosition={lessonPosition}
          lessonTotal={lessonTotal}
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          isLessonOrderPending={isLessonOrderPending}
          onMoveLesson={onMoveLesson}
          primaryAction={
            <div className="flex flex-wrap gap-2">
              {isReordering ? (
                <Button
                  size="sm"
                  onPress={() => {
                    setIsReordering(false);
                    setReorderAnnouncement('');
                  }}
                >
                  Done reordering
                </Button>
              ) : (
                <>
                  <CreateVocabModal
                    lessonId={lesson.id}
                    onCreated={() => controller.loadVocabulary(false)}
                  />
                  <BulkCreateVocabModal
                    lessonId={lesson.id}
                    existingCards={controller.orderedVocabs ?? []}
                    onCreated={async vocabIds => {
                      await controller.loadVocabulary(false);
                      requestAnimationFrame(() => {
                        document
                          .getElementById(`vocab-card-${vocabIds[0]}`)
                          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      });
                    }}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    isDisabled={vocabCount < 2}
                    onPress={() => {
                      setIsReordering(true);
                      setReorderAnnouncement('');
                    }}
                  >
                    Reorder cards
                  </Button>
                </>
              )}
            </div>
          }
        />

        <p className="sr-only" aria-live="polite">
          {reorderAnnouncement}
        </p>

        {isReordering ? (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <div>
              <p className="text-sm font-medium text-default-800">Reordering cards</p>
              <p className="mt-0.5 text-xs leading-5 text-default-500">
                Use the arrows for small moves, or choose Move to… for a longer jump.
              </p>
            </div>
          </div>
        ) : null}

        {controller.mutationError ? (
          <StatusAlert status="danger">{controller.mutationError}</StatusAlert>
        ) : null}

        {controller.isLoading ? (
          <VocabularyLoading />
        ) : controller.orderedVocabs ? (
          <VocabTable
            vocabs={controller.orderedVocabs}
            emptyDescription="Add cards to start building this lesson."
            highlightedVocabId={highlightedVocabId}
            renderActions={(vocab, index) =>
              isReordering ? (
                <VocabReorderActions
                  vocabFront={vocab.front}
                  index={index}
                  total={controller.orderedVocabs?.length ?? 0}
                  moving={controller.movingVocabId !== null}
                  movePending={controller.movingVocabId === vocab.id}
                  onMoveToPosition={() => controller.setMoveTarget(vocab)}
                  onMove={direction => void moveCard(vocab.id, vocab.front, index, direction)}
                />
              ) : (
                <VocabActions
                  vocabFront={vocab.front}
                  onEdit={() => controller.setSelectedVocab(vocab)}
                  onDelete={() => controller.setDeleteTarget(vocab)}
                />
              )
            }
          />
        ) : (
          <Button variant="secondary" onPress={() => void controller.loadVocabulary()}>
            Try loading again
          </Button>
        )}

        <div className="flex flex-wrap gap-2 border-t border-default-200 pt-4">
          <Button
            size="sm"
            variant="danger-soft"
            isPending={controller.isDeleting}
            onPress={() => controller.setDeleteTarget('lesson')}
          >
            Delete lesson
          </Button>
        </div>

        <EditVocabModal
          vocab={controller.selectedVocab}
          isOpen={controller.selectedVocab !== null}
          onOpenChange={isOpen => {
            if (!isOpen) controller.setSelectedVocab(null);
          }}
          onSaved={() => controller.loadVocabulary(false)}
          navigation={
            selectedVocabIndex >= 0 && controller.orderedVocabs
              ? {
                  position: selectedVocabIndex + 1,
                  total: controller.orderedVocabs.length,
                  canGoPrevious: selectedVocabIndex > 0,
                  canGoNext: selectedVocabIndex < controller.orderedVocabs.length - 1,
                  onNavigate: direction => {
                    const nextIndex =
                      direction === 'previous' ? selectedVocabIndex - 1 : selectedVocabIndex + 1;
                    controller.setSelectedVocab(controller.orderedVocabs?.[nextIndex] ?? null);
                  },
                }
              : undefined
          }
        />
        <MoveVocabModal
          vocab={controller.moveTarget}
          currentPosition={
            controller.moveTarget
              ? (controller.orderedVocabs?.findIndex(
                  vocab => vocab.id === controller.moveTarget?.id,
                ) ?? -1) + 1
              : 0
          }
          totalPositions={controller.orderedVocabs?.length ?? 0}
          isOpen={controller.moveTarget !== null}
          onOpenChange={isOpen => {
            if (!isOpen) controller.setMoveTarget(null);
          }}
          onMove={async position => {
            const target = controller.moveTarget;
            if (!target) return 'The card is no longer available.';

            setRecentlyMovedVocabId(target.id);
            const moveError = await controller.moveVocabToPosition(target.id, position);
            if (moveError) {
              setRecentlyMovedVocabId(null);
              return moveError;
            }
            setReorderAnnouncement(`${target.front} moved to position ${position}.`);
            return null;
          }}
        />
        <ConfirmationDialog
          isOpen={controller.deleteTarget !== null}
          onOpenChange={isOpen => {
            if (!isOpen && !controller.isDeleting && controller.deletingVocabId === null) {
              controller.setDeleteTarget(null);
            }
          }}
          title={
            controller.deleteTarget === 'lesson'
              ? `Delete lesson “${lesson.title}”?`
              : `Delete “${controller.deleteTarget?.front ?? ''}”?`
          }
          description={
            controller.deleteTarget === 'lesson'
              ? 'The lesson and all of its cards will be deleted.'
              : 'This card will be permanently deleted. This cannot be undone.'
          }
          confirmLabel={controller.deleteTarget === 'lesson' ? 'Delete lesson' : 'Delete card'}
          isPending={controller.isDeleting || controller.deletingVocabId !== null}
          onConfirm={async () => {
            const target = controller.deleteTarget;
            if (target === 'lesson') await controller.deleteLesson();
            else if (target) await controller.deleteVocab(target);
            controller.setDeleteTarget(null);
          }}
        />
      </div>
    </section>
  );
}
