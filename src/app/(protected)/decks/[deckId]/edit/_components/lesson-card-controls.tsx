'use client';

import EditLessonModal from './edit-lesson-modal';
import type { EditLessonSummary } from '@/types/lesson.types';
import type { OrderDirection } from '@/types/order.types';
import {
  ArrowsUpDownIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@heroui/react';
import type { ReactNode } from 'react';

export function LessonToolbar({
  lesson,
  lessonPosition,
  lessonTotal,
  canMoveUp,
  canMoveDown,
  isLessonOrderPending,
  onMoveLesson,
  primaryAction,
}: {
  lesson: EditLessonSummary;
  lessonPosition: number;
  lessonTotal: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isLessonOrderPending: boolean;
  onMoveLesson: (lessonId: number, direction: OrderDirection) => void;
  primaryAction: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center justify-between gap-3 sm:flex-1">
        <p className="text-sm text-muted">Manage the cards in this lesson.</p>
        {primaryAction}
      </div>
      <div className="flex flex-wrap items-center gap-1 sm:border-l sm:border-default-200 sm:pl-3">
        <EditLessonModal lesson={lesson} />
        <span className="px-2 text-xs tabular-nums text-default-500">
          {lessonPosition} of {lessonTotal}
        </span>
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

export function VocabReorderActions({
  vocabFront,
  index,
  total,
  moving,
  movePending,
  onMoveToPosition,
  onMove,
}: {
  vocabFront: string;
  index: number;
  total: number;
  moving: boolean;
  movePending: boolean;
  onMoveToPosition: () => void;
  onMove: (direction: OrderDirection) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {movePending ? (
        <span className="mr-1 text-xs text-default-500" role="status">
          Saving…
        </span>
      ) : null}
      <Button
        size="sm"
        variant="secondary"
        className="px-3"
        isDisabled={total < 2 || moving}
        aria-label={`Move ${vocabFront} to another position`}
        onPress={onMoveToPosition}
      >
        <ArrowsUpDownIcon className="size-4" aria-hidden="true" />
        Move to…
      </Button>
      <Button
        size="sm"
        variant="tertiary"
        isIconOnly
        isDisabled={index === 0 || moving}
        aria-label={`Move ${vocabFront} up from position ${index + 1}`}
        onPress={() => onMove('up')}
      >
        <ChevronUpIcon className="size-4" aria-hidden="true" />
      </Button>
      <Button
        size="sm"
        variant="tertiary"
        isIconOnly
        isDisabled={index === total - 1 || moving}
        aria-label={`Move ${vocabFront} down from position ${index + 1}`}
        onPress={() => onMove('down')}
      >
        <ChevronDownIcon className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}

export function VocabActions({
  vocabFront,
  onEdit,
  onDelete,
}: {
  vocabFront: string;
  onEdit: () => void;
  onDelete: () => void;
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
    </div>
  );
}
