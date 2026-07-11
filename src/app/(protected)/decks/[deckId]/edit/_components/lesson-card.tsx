'use client';

import { useEffect, useState } from 'react';
import CreateVocabModal from '@/app/(protected)/decks/[deckId]/edit/_components/create-vocab-modal';
import VocabTable from '@/app/(protected)/decks/[deckId]/_components/vocab/vocab-table';
import { deleteLessonAction } from '@/server/lesson.actions';
import { deleteVocabAction, moveVocabAction } from '@/server/vocab.actions';
import { Lesson } from '@/types/lesson.types';
import { OrderDirection } from '@/types/order.types';
import { Vocab } from '@/types/vocab.types';
import { Button, Card, Chip } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { ChevronDownIcon, ChevronUpIcon, TrashIcon } from '@heroicons/react/24/outline';
import { moveItem } from '@/lib/order/move-item';
import EditVocabModal from '@/app/(protected)/decks/[deckId]/edit/_components/edit-vocab-modal';
import EditLessonModal from '@/app/(protected)/decks/[deckId]/edit/_components/edit-lesson-modal';

type Props = {
  lesson: Lesson;
  vocabs: Vocab[];
  canMoveUp: boolean;
  canMoveDown: boolean;
  isLessonOrderPending: boolean;
  onMoveLesson: (lessonId: number, direction: OrderDirection) => void;
};

export default function LessonCard({
  lesson,
  vocabs,
  canMoveUp,
  canMoveDown,
  isLessonOrderPending,
  onMoveLesson,
}: Props) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [orderedVocabs, setOrderedVocabs] = useState(vocabs);
  const [movingVocabId, setMovingVocabId] = useState<number | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  useEffect(() => {
    setOrderedVocabs(vocabs);
  }, [vocabs]);

  const handleDelete = async () => {
    if (isDeleting) return;
    if (!window.confirm(`Delete lesson “${lesson.title}” and all of its vocabulary?`)) return;

    try {
      setIsDeleting(true);
      setMutationError(null);
      await deleteLessonAction(lesson.id);
      router.refresh();
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : 'Could not delete the lesson.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMoveVocab = async (vocabId: number, direction: OrderDirection) => {
    if (movingVocabId !== null) return;

    const previousVocabs = orderedVocabs;
    const currentIndex = previousVocabs.findIndex(vocab => vocab.id === vocabId);
    const nextVocabs = moveItem(previousVocabs, currentIndex, direction);
    if (nextVocabs === previousVocabs) return;

    setOrderedVocabs(nextVocabs);
    setMovingVocabId(vocabId);

    try {
      await moveVocabAction(vocabId, direction);
      router.refresh();
    } catch (error) {
      setOrderedVocabs(previousVocabs);
      setMutationError(error instanceof Error ? error.message : 'Could not reorder vocabulary.');
    } finally {
      setMovingVocabId(null);
    }
  };

  const handleDeleteVocab = async (vocab: Vocab) => {
    if (!window.confirm(`Delete “${vocab.front}”? This cannot be undone.`)) return;
    try {
      setMutationError(null);
      await deleteVocabAction(vocab.id);
      setOrderedVocabs(current => current.filter(item => item.id !== vocab.id));
      router.refresh();
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : 'Could not delete vocabulary.');
    }
  };

  return (
    <Card>
      <Card.Header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Card.Title>{lesson.title}</Card.Title>
          <Card.Description>Manage the words in this lesson.</Card.Description>
        </div>

        <div className="flex items-center gap-1">
          <EditLessonModal lesson={lesson} />
          <Chip size="sm" variant="soft">
            {orderedVocabs.length} {orderedVocabs.length === 1 ? 'word' : 'words'}
          </Chip>
          <Button
            size="sm"
            variant="tertiary"
            isIconOnly
            isDisabled={!canMoveUp || isLessonOrderPending}
            aria-label={`Move ${lesson.title} up`}
            onPress={() => onMoveLesson(lesson.id, 'up')}
          >
            <ChevronUpIcon className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="tertiary"
            isIconOnly
            isDisabled={!canMoveDown || isLessonOrderPending}
            aria-label={`Move ${lesson.title} down`}
            onPress={() => onMoveLesson(lesson.id, 'down')}
          >
            <ChevronDownIcon className="h-4 w-4" />
          </Button>
        </div>
      </Card.Header>

      <Card.Content>
        <VocabTable
          vocabs={orderedVocabs}
          emptyDescription="Add vocabulary to start building this lesson."
          renderActions={(vocab, index) => (
            <div className="flex items-center gap-1">
              <EditVocabModal vocab={vocab} />
              <Button
                size="sm"
                variant="danger-soft"
                isIconOnly
                aria-label={`Delete ${vocab.front}`}
                onPress={() => handleDeleteVocab(vocab)}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="tertiary"
                isIconOnly
                isDisabled={index === 0 || movingVocabId !== null}
                aria-label={`Move ${vocab.front} up`}
                onPress={() => handleMoveVocab(vocab.id, 'up')}
              >
                <ChevronUpIcon className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="tertiary"
                isIconOnly
                isDisabled={index === orderedVocabs.length - 1 || movingVocabId !== null}
                aria-label={`Move ${vocab.front} down`}
                onPress={() => handleMoveVocab(vocab.id, 'down')}
              >
                <ChevronDownIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
        />
      </Card.Content>

      <Card.Footer className="flex flex-wrap gap-2">
        {mutationError ? (
          <p role="alert" className="w-full text-sm text-danger">
            {mutationError}
          </p>
        ) : null}
        <CreateVocabModal lessonId={lesson.id} />
        <Button size="sm" variant="danger-soft" isPending={isDeleting} onPress={handleDelete}>
          Delete lesson
        </Button>
      </Card.Footer>
    </Card>
  );
}
