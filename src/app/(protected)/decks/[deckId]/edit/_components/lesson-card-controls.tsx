import EditLessonModal from './edit-lesson-modal';
import type { EditLessonSummary } from '@/types/lesson.types';
import type { OrderDirection } from '@/types/order.types';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  NumberedListIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Button, Tooltip } from '@heroui/react';

export function LessonToolbar({
  lesson,
  canMoveUp,
  canMoveDown,
  isLessonOrderPending,
  onMoveLesson,
}: {
  lesson: EditLessonSummary;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isLessonOrderPending: boolean;
  onMoveLesson: (lessonId: number, direction: OrderDirection) => void;
}) {
  return (
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
  );
}

export function VocabActions({
  vocabFront,
  index,
  total,
  moving,
  onEdit,
  onDelete,
  onMoveToPosition,
  onMove,
}: {
  vocabFront: string;
  index: number;
  total: number;
  moving: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveToPosition: () => void;
  onMove: (direction: OrderDirection) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button
        size="sm"
        variant="tertiary"
        isIconOnly
        aria-label={`Edit ${vocabFront}`}
        onPress={onEdit}
      >
        <PencilSquareIcon className="size-4" aria-hidden="true" />
      </Button>
      <Button
        size="sm"
        variant="danger-soft"
        isIconOnly
        aria-label={`Delete ${vocabFront}`}
        onPress={onDelete}
      >
        <TrashIcon className="size-4" aria-hidden="true" />
      </Button>
      <Tooltip delay={300}>
        <Button
          size="sm"
          variant="tertiary"
          isIconOnly
          isDisabled={total < 2 || moving}
          aria-label={`Move ${vocabFront} to another position`}
          onPress={onMoveToPosition}
        >
          <NumberedListIcon className="size-4" aria-hidden="true" />
        </Button>
        <Tooltip.Content>Move to position</Tooltip.Content>
      </Tooltip>
      <Button
        size="sm"
        variant="tertiary"
        isIconOnly
        isDisabled={index === 0 || moving}
        aria-label={`Move ${vocabFront} up`}
        onPress={() => onMove('up')}
      >
        <ChevronUpIcon className="size-4" aria-hidden="true" />
      </Button>
      <Button
        size="sm"
        variant="tertiary"
        isIconOnly
        isDisabled={index === total - 1 || moving}
        aria-label={`Move ${vocabFront} down`}
        onPress={() => onMove('down')}
      >
        <ChevronDownIcon className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
