'use client';

import CreateVocabModal from './create-vocab-modal';
import EditVocabModal from './edit-vocab-modal';
import MoveVocabModal from './move-vocab-modal';
import VocabularyLoading from './vocabulary-loading';
import { useLessonCardController } from './use-lesson-card-controller';
import { LessonToolbar, VocabActions } from './lesson-card-controls';
import VocabTable from '@/app/(protected)/decks/[deckId]/_components/vocab/vocab-table';
import ConfirmationDialog from '@/components/shared/confirmation-dialog';
import StatusAlert from '@/components/shared/status-alert';
import type { EditLessonSummary } from '@/types/lesson.types';
import type { OrderDirection } from '@/types/order.types';
import { Accordion, Button, Chip } from '@heroui/react';

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
  const controller = useLessonCardController({
    deckId,
    lesson,
    isExpanded,
    onCardCountChange,
  });
  const vocabCount = controller.orderedVocabs?.length ?? lesson.vocabCount;

  return (
    <Accordion.Item id={String(lesson.id)}>
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
            <LessonToolbar
              lesson={lesson}
              canMoveUp={canMoveUp}
              canMoveDown={canMoveDown}
              isLessonOrderPending={isLessonOrderPending}
              onMoveLesson={onMoveLesson}
            />

            {controller.mutationError ? (
              <StatusAlert status="danger">{controller.mutationError}</StatusAlert>
            ) : null}

            {controller.isLoading ? (
              <VocabularyLoading />
            ) : controller.orderedVocabs ? (
              <VocabTable
                vocabs={controller.orderedVocabs}
                emptyDescription="Add cards to start building this lesson."
                renderActions={(vocab, index) => (
                  <VocabActions
                    vocabFront={vocab.front}
                    index={index}
                    total={controller.orderedVocabs?.length ?? 0}
                    moving={controller.movingVocabId !== null}
                    onEdit={() => controller.setSelectedVocab(vocab)}
                    onDelete={() => controller.setDeleteTarget(vocab)}
                    onMoveToPosition={() => controller.setMoveTarget(vocab)}
                    onMove={direction => controller.moveVocab(vocab.id, direction)}
                  />
                )}
              />
            ) : (
              <Button variant="secondary" onPress={() => void controller.loadVocabulary()}>
                Try loading again
              </Button>
            )}

            <div className="flex flex-wrap gap-2 border-t border-default-200 pt-4">
              <CreateVocabModal
                lessonId={lesson.id}
                onCreated={() => controller.loadVocabulary(false)}
              />
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
              onMove={position =>
                controller.moveTarget
                  ? controller.moveVocabToPosition(controller.moveTarget.id, position)
                  : Promise.resolve('The card is no longer available.')
              }
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
        </Accordion.Body>
      </Accordion.Panel>
    </Accordion.Item>
  );
}
