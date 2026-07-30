'use client';

import { getEditableLessonVocabulary } from '@/lib/client/vocabulary-api';
import { isActionFailure } from '@/lib/action-result';
import { moveItem, moveItemToIndex } from '@/lib/order/move-item';
import { deleteLessonAction } from '@/server/lesson.actions';
import {
  deleteVocabAction,
  moveVocabAction,
  moveVocabToPositionAction,
} from '@/server/vocab.actions';
import type { EditLessonSummary } from '@/types/lesson.types';
import type { OrderDirection } from '@/types/order.types';
import type { Vocab } from '@/types/vocab.types';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

type Params = {
  deckId: number;
  lesson: EditLessonSummary;
  isActive: boolean;
  onCardCountChange: (lessonId: number, cardCount: number) => void;
};

export function useLessonCardController({ deckId, lesson, isActive, onCardCountChange }: Params) {
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

  const loadVocabulary = useCallback(
    async (showLoading = true) => {
      if (showLoading) setIsLoading(true);
      setMutationError(null);

      try {
        const vocabs = await getEditableLessonVocabulary(deckId, lesson.id);
        setOrderedVocabs(vocabs);
        onCardCountChange(lesson.id, vocabs.length);
      } catch (error) {
        setMutationError(
          error instanceof Error ? error.message : 'Could not load this lesson’s cards.',
        );
      } finally {
        if (showLoading) setIsLoading(false);
      }
    },
    [deckId, lesson.id, onCardCountChange],
  );

  useEffect(() => {
    if (!isActive) {
      loadRequested.current = false;
      return;
    }
    if (loadRequested.current || orderedVocabs !== null || isLoading) return;

    loadRequested.current = true;
    void loadVocabulary();
  }, [isActive, isLoading, loadVocabulary, orderedVocabs]);

  const deleteLesson = async () => {
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

  const moveVocab = async (vocabId: number, direction: OrderDirection) => {
    if (!orderedVocabs || movingVocabId !== null) return false;

    const previousVocabs = orderedVocabs;
    const currentIndex = previousVocabs.findIndex(vocab => vocab.id === vocabId);
    const nextVocabs = moveItem(previousVocabs, currentIndex, direction);
    if (nextVocabs === previousVocabs) return false;

    setOrderedVocabs(nextVocabs);
    setMovingVocabId(vocabId);
    setMutationError(null);

    try {
      const result = await moveVocabAction(vocabId, direction);
      if (isActionFailure(result)) {
        setOrderedVocabs(previousVocabs);
        setMutationError(result.message);
        return false;
      }
      return true;
    } catch (error) {
      setOrderedVocabs(previousVocabs);
      setMutationError(error instanceof Error ? error.message : 'Could not reorder cards.');
      return false;
    } finally {
      setMovingVocabId(null);
    }
  };

  const moveVocabToPosition = async (vocabId: number, position: number): Promise<string | null> => {
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
      const message = error instanceof Error ? error.message : 'Could not reorder cards.';
      setOrderedVocabs(previousVocabs);
      setMutationError(message);
      return message;
    } finally {
      setMovingVocabId(null);
    }
  };

  const deleteVocab = async (vocab: Vocab) => {
    try {
      setDeletingVocabId(vocab.id);
      setMutationError(null);
      const result = await deleteVocabAction(vocab.id);
      if (isActionFailure(result)) {
        setMutationError(result.message);
        return;
      }
      const nextVocabs = orderedVocabs?.filter(item => item.id !== vocab.id) ?? null;
      setOrderedVocabs(nextVocabs);
      if (nextVocabs) onCardCountChange(lesson.id, nextVocabs.length);
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : 'Could not delete the card.');
    } finally {
      setDeletingVocabId(null);
    }
  };

  return {
    deleteLesson,
    deleteTarget,
    deleteVocab,
    deletingVocabId,
    isDeleting,
    isLoading,
    loadVocabulary,
    moveTarget,
    moveVocab,
    moveVocabToPosition,
    movingVocabId,
    mutationError,
    orderedVocabs,
    selectedVocab,
    setDeleteTarget,
    setMoveTarget,
    setSelectedVocab,
  };
}
