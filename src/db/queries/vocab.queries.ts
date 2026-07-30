import { db } from '@/db';
import { decks, lessons, userVocabState, vocabRevisions, vocabs } from '@/db/schema';
import { Vocab } from '@/types/vocab.types';
import { and, eq, getTableColumns, isNull, sql } from 'drizzle-orm';
import { OrderDirection } from '@/types/order.types';
import { DeckDomainError } from '@/lib/deck-domain';
import { assertAuthoringCapacity } from '@/lib/authoring-quota';
import type {
  NormalizedVocabContent,
  NormalizedVocabUpdate,
} from '@/lib/vocab/normalize-vocab-content';
import { resolveVocabUpdate } from '@/lib/vocab/normalize-vocab-content';
import {
  vocabContentValues,
  vocabRevisionContentSelection,
  vocabRevisionValues,
} from '@/db/queries/vocab-content';
import { getAuthoringUsage, lockAuthoringAccount } from '@/db/queries/authoring-quota.queries';
import {
  activeEditableLessonCondition,
  activeEditableVocabCondition,
} from '@/db/queries/authoring-access';

export const getVocabByLessonId = async (lessonId: number): Promise<Vocab[]> => {
  return db
    .select({
      ...getTableColumns(vocabs),
      ...vocabRevisionContentSelection,
    })
    .from(vocabs)
    .innerJoin(vocabRevisions, eq(vocabRevisions.id, vocabs.currentRevisionId))
    .where(and(eq(vocabs.lessonId, lessonId), isNull(vocabs.removedAt)))
    .orderBy(vocabs.orderIndex, vocabs.id);
};

export const getVocabByDeckId = async (deckId: number): Promise<Vocab[]> => {
  return db
    .select({
      ...getTableColumns(vocabs),
      ...vocabRevisionContentSelection,
    })
    .from(vocabs)
    .innerJoin(lessons, eq(vocabs.lessonId, lessons.id))
    .innerJoin(vocabRevisions, eq(vocabRevisions.id, vocabs.currentRevisionId))
    .where(and(eq(lessons.deckId, deckId), isNull(lessons.removedAt), isNull(vocabs.removedAt)))
    .orderBy(lessons.orderIndex, lessons.id, vocabs.orderIndex, vocabs.id);
};

export const getUserVocabStatesByLessonId = async (lessonId: number, userId: string) => {
  return db
    .select({
      vocabId: userVocabState.vocabId,
      srsLevel: userVocabState.srsLevel,
      dueAt: userVocabState.dueAt,
    })
    .from(userVocabState)
    .innerJoin(vocabs, eq(userVocabState.vocabId, vocabs.id))
    .where(and(eq(vocabs.lessonId, lessonId), eq(userVocabState.userId, userId)));
};

export const getUserVocabStatesByDeckId = async (deckId: number, userId: string) => {
  return db
    .select({
      vocabId: userVocabState.vocabId,
      srsLevel: userVocabState.srsLevel,
      dueAt: userVocabState.dueAt,
    })
    .from(userVocabState)
    .innerJoin(vocabs, eq(userVocabState.vocabId, vocabs.id))
    .innerJoin(lessons, eq(vocabs.lessonId, lessons.id))
    .where(and(eq(lessons.deckId, deckId), eq(userVocabState.userId, userId)));
};

export const createVocab = async (
  vocab: NormalizedVocabContent & { lessonId: number },
  userId: string,
): Promise<number> => {
  return db.transaction(async tx => {
    await lockAuthoringAccount(tx, userId);
    const [lesson] = await tx
      .select({ deckId: lessons.deckId })
      .from(lessons)
      .innerJoin(decks, eq(lessons.deckId, decks.id))
      .where(activeEditableLessonCondition(vocab.lessonId, userId))
      .for('update')
      .limit(1);

    if (!lesson) throw new Error('Lesson not found or access denied.');
    assertAuthoringCapacity(await getAuthoringUsage(tx, userId, lesson.deckId), {
      deckCards: 1,
      logicalVocabs: 1,
      revisionsToday: 1,
    });

    const [order] = await tx
      .select({
        nextIndex: sql<number>`coalesce(max(${vocabs.orderIndex}), -1) + 1`,
      })
      .from(vocabs)
      .where(eq(vocabs.lessonId, vocab.lessonId));

    const [created] = await tx
      .insert(vocabs)
      .values({
        lessonId: vocab.lessonId,
        ...vocabContentValues(vocab),
        orderIndex: Number(order.nextIndex),
      })
      .returning({ id: vocabs.id });
    const [revision] = await tx
      .insert(vocabRevisions)
      .values(vocabRevisionValues(created.id, vocab, userId))
      .returning({ id: vocabRevisions.id });
    await tx
      .update(vocabs)
      .set({ currentRevisionId: revision.id, rootVocabId: created.id })
      .where(eq(vocabs.id, created.id));
    return lesson.deckId;
  });
};

export const createVocabs = async (
  lessonId: number,
  cards: NormalizedVocabContent[],
  userId: string,
): Promise<{ deckId: number; vocabIds: number[] }> => {
  return db.transaction(async tx => {
    await lockAuthoringAccount(tx, userId);
    const [lesson] = await tx
      .select({ deckId: lessons.deckId })
      .from(lessons)
      .innerJoin(decks, eq(lessons.deckId, decks.id))
      .where(activeEditableLessonCondition(lessonId, userId))
      .for('update')
      .limit(1);

    if (!lesson) throw new Error('Lesson not found or access denied.');
    assertAuthoringCapacity(await getAuthoringUsage(tx, userId, lesson.deckId), {
      deckCards: cards.length,
      logicalVocabs: cards.length,
      revisionsToday: cards.length,
    });

    const [order] = await tx
      .select({
        nextIndex: sql<number>`coalesce(max(${vocabs.orderIndex}), -1) + 1`,
      })
      .from(vocabs)
      .where(eq(vocabs.lessonId, lessonId));
    const firstOrderIndex = Number(order.nextIndex);

    const created = await tx
      .insert(vocabs)
      .values(
        cards.map((card, index) => ({
          lessonId,
          ...vocabContentValues(card),
          orderIndex: firstOrderIndex + index,
        })),
      )
      .returning({ id: vocabs.id, orderIndex: vocabs.orderIndex });
    const createdByOrder = new Map(created.map(card => [card.orderIndex, card.id]));
    const vocabIds = cards.map((_, index) => {
      const vocabId = createdByOrder.get(firstOrderIndex + index);
      if (!vocabId) throw new Error('Could not preserve the card order.');
      return vocabId;
    });

    const revisions = await tx
      .insert(vocabRevisions)
      .values(cards.map((card, index) => vocabRevisionValues(vocabIds[index], card, userId)))
      .returning({ id: vocabRevisions.id, vocabId: vocabRevisions.vocabId });
    const revisionByVocab = new Map(revisions.map(revision => [revision.vocabId, revision.id]));

    for (const vocabId of vocabIds) {
      const revisionId = revisionByVocab.get(vocabId);
      if (!revisionId) throw new Error('Could not create a card revision.');
      await tx
        .update(vocabs)
        .set({ currentRevisionId: revisionId, rootVocabId: vocabId })
        .where(eq(vocabs.id, vocabId));
    }

    return { deckId: lesson.deckId, vocabIds };
  });
};

export const moveVocab = async (
  vocabId: number,
  userId: string,
  direction: OrderDirection,
): Promise<number> => {
  return db.transaction(async tx => {
    await lockAuthoringAccount(tx, userId);
    const [targetVocab] = await tx
      .select({ lessonId: vocabs.lessonId, deckId: lessons.deckId })
      .from(vocabs)
      .innerJoin(lessons, eq(vocabs.lessonId, lessons.id))
      .innerJoin(decks, eq(lessons.deckId, decks.id))
      .where(activeEditableVocabCondition(vocabId, userId))
      .for('update')
      .limit(1);

    if (!targetVocab) {
      throw new Error('Vocabulary not found or access denied');
    }

    const orderedVocabs = await tx
      .select({ id: vocabs.id, orderIndex: vocabs.orderIndex })
      .from(vocabs)
      .where(and(eq(vocabs.lessonId, targetVocab.lessonId), isNull(vocabs.removedAt)))
      .orderBy(vocabs.orderIndex, vocabs.id);

    const currentIndex = orderedVocabs.findIndex(vocab => vocab.id === vocabId);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= orderedVocabs.length) {
      return targetVocab.deckId;
    }

    const currentVocab = orderedVocabs[currentIndex];
    const adjacentVocab = orderedVocabs[targetIndex];
    await tx
      .update(vocabs)
      .set({ orderIndex: adjacentVocab.orderIndex })
      .where(eq(vocabs.id, currentVocab.id));
    await tx
      .update(vocabs)
      .set({ orderIndex: currentVocab.orderIndex })
      .where(eq(vocabs.id, adjacentVocab.id));

    return targetVocab.deckId;
  });
};

export const moveVocabToPosition = async (
  vocabId: number,
  userId: string,
  targetIndex: number,
): Promise<number> => {
  return db.transaction(async tx => {
    await lockAuthoringAccount(tx, userId);
    const [targetVocab] = await tx
      .select({ lessonId: vocabs.lessonId, deckId: lessons.deckId })
      .from(vocabs)
      .innerJoin(lessons, eq(vocabs.lessonId, lessons.id))
      .innerJoin(decks, eq(lessons.deckId, decks.id))
      .where(activeEditableVocabCondition(vocabId, userId))
      .for('update')
      .limit(1);

    if (!targetVocab) {
      throw new Error('Vocabulary not found or access denied');
    }

    const orderedVocabs = await tx
      .select({ id: vocabs.id })
      .from(vocabs)
      .where(and(eq(vocabs.lessonId, targetVocab.lessonId), isNull(vocabs.removedAt)))
      .orderBy(vocabs.orderIndex, vocabs.id);

    const currentIndex = orderedVocabs.findIndex(vocab => vocab.id === vocabId);
    if (
      currentIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >= orderedVocabs.length ||
      !Number.isInteger(targetIndex)
    ) {
      throw new Error('Invalid vocabulary position.');
    }

    if (currentIndex === targetIndex) return targetVocab.deckId;

    const reorderedVocabs = [...orderedVocabs];
    const [movedVocab] = reorderedVocabs.splice(currentIndex, 1);
    reorderedVocabs.splice(targetIndex, 0, movedVocab);

    for (const [orderIndex, vocab] of reorderedVocabs.entries()) {
      await tx.update(vocabs).set({ orderIndex }).where(eq(vocabs.id, vocab.id));
    }

    return targetVocab.deckId;
  });
};

export const updateVocab = async (
  vocabId: number,
  vocab: NormalizedVocabUpdate,
  userId: string,
): Promise<number> => {
  return db.transaction(async tx => {
    await lockAuthoringAccount(tx, userId);
    const [target] = await tx
      .select({ deckId: lessons.deckId })
      .from(vocabs)
      .innerJoin(lessons, eq(vocabs.lessonId, lessons.id))
      .innerJoin(decks, eq(lessons.deckId, decks.id))
      .where(activeEditableVocabCondition(vocabId, userId))
      .for('update')
      .limit(1);
    if (!target) throw new Error('Vocabulary not found or access denied.');
    assertAuthoringCapacity(await getAuthoringUsage(tx, userId, target.deckId), {
      revisionsToday: 1,
    });

    const [current] = await tx.select().from(vocabs).where(eq(vocabs.id, vocabId)).limit(1);
    const content = resolveVocabUpdate(vocab, current);
    const [revision] = await tx
      .insert(vocabRevisions)
      .values(vocabRevisionValues(vocabId, content, userId))
      .returning({ id: vocabRevisions.id });
    await tx
      .update(vocabs)
      .set({
        ...content,
        updatedAt: new Date(),
        currentRevisionId: revision.id,
      })
      .where(eq(vocabs.id, vocabId));
    return target.deckId;
  });
};

export const deleteVocab = async (vocabId: number, userId: string): Promise<number> => {
  return db.transaction(async tx => {
    const [target] = await tx
      .select({ deckId: lessons.deckId })
      .from(vocabs)
      .innerJoin(lessons, eq(vocabs.lessonId, lessons.id))
      .innerJoin(decks, eq(lessons.deckId, decks.id))
      .where(activeEditableVocabCondition(vocabId, userId))
      .for('update')
      .limit(1);
    if (!target) throw new Error('Vocabulary not found or access denied.');

    await tx
      .update(vocabs)
      .set({ removedAt: new Date(), updatedAt: new Date() })
      .where(eq(vocabs.id, vocabId));
    return target.deckId;
  });
};

export const restoreVocab = async (vocabId: number, userId: string): Promise<number> => {
  return db.transaction(async tx => {
    const [target] = await tx
      .select({ deckId: lessons.deckId })
      .from(vocabs)
      .innerJoin(lessons, eq(lessons.id, vocabs.lessonId))
      .innerJoin(decks, eq(decks.id, lessons.deckId))
      .where(
        and(
          eq(vocabs.id, vocabId),
          eq(decks.ownerId, userId),
          eq(decks.status, 'active'),
          isNull(lessons.removedAt),
          sql`${vocabs.removedAt} is not null`,
        ),
      )
      .for('update', { of: vocabs })
      .limit(1);
    if (!target) throw new DeckDomainError('VOCAB_NOT_FOUND', 'Removed vocabulary not found.');
    await tx
      .update(vocabs)
      .set({ removedAt: null, updatedAt: new Date() })
      .where(eq(vocabs.id, vocabId));
    return target.deckId;
  });
};

/** Meaning-changing replacement: creates a fresh logical identity and retires the old draft item. */
export const replaceVocab = async (
  vocabId: number,
  replacement: NormalizedVocabContent,
  userId: string,
): Promise<{ deckId: number; vocabId: number }> => {
  return db.transaction(async tx => {
    await lockAuthoringAccount(tx, userId);
    const [current] = await tx
      .select({ vocab: vocabs, deckId: lessons.deckId })
      .from(vocabs)
      .innerJoin(lessons, eq(vocabs.lessonId, lessons.id))
      .innerJoin(decks, eq(lessons.deckId, decks.id))
      .where(activeEditableVocabCondition(vocabId, userId))
      .for('update', { of: vocabs })
      .limit(1);
    if (!current) throw new Error('Vocabulary not found or access denied.');
    assertAuthoringCapacity(await getAuthoringUsage(tx, userId, current.deckId), {
      logicalVocabs: 1,
      revisionsToday: 1,
    });

    const [created] = await tx
      .insert(vocabs)
      .values({
        lessonId: current.vocab.lessonId,
        ...replacement,
        orderIndex: current.vocab.orderIndex,
      })
      .returning({ id: vocabs.id });
    const [revision] = await tx
      .insert(vocabRevisions)
      .values(vocabRevisionValues(created.id, replacement, userId))
      .returning({ id: vocabRevisions.id });
    await tx
      .update(vocabs)
      .set({ currentRevisionId: revision.id, rootVocabId: created.id })
      .where(eq(vocabs.id, created.id));
    await tx
      .update(vocabs)
      .set({ removedAt: new Date(), updatedAt: new Date() })
      .where(eq(vocabs.id, vocabId));
    return { deckId: current.deckId, vocabId: created.id };
  });
};
