import { db } from '@/db';
import { decks, lessons, userVocabState, vocabs } from '@/db/schema';
import { CreateVocab, UpdateVocabInput, Vocab } from '@/types/vocab.types';
import { and, eq, getTableColumns, isNull, sql } from 'drizzle-orm';
import { OrderDirection } from '@/types/order.types';

export const getVocabByDeckId = async (deckId: number): Promise<Vocab[]> => {
  return await db
    .select({ ...getTableColumns(vocabs) })
    .from(vocabs)
    .innerJoin(lessons, eq(vocabs.lessonId, lessons.id))
    .where(eq(lessons.deckId, deckId))
    .orderBy(lessons.orderIndex, vocabs.orderIndex, vocabs.id);
};

export const getVocabByLessonId = async (lessonId: number): Promise<Vocab[]> => {
  return db
    .select()
    .from(vocabs)
    .where(eq(vocabs.lessonId, lessonId))
    .orderBy(vocabs.orderIndex, vocabs.id);
};

export const getVocabById = async (vocabId: number): Promise<Vocab | undefined> => {
  return (await db.select().from(vocabs).where(eq(vocabs.id, vocabId)).limit(1))[0];
};

export const getUserVocabLevelsByLessonId = async (lessonId: number, userId: string) => {
  return db
    .select({
      vocabId: userVocabState.vocabId,
      srsLevel: userVocabState.srsLevel,
    })
    .from(userVocabState)
    .innerJoin(vocabs, eq(userVocabState.vocabId, vocabs.id))
    .where(and(eq(vocabs.lessonId, lessonId), eq(userVocabState.userId, userId)));
};

export const createVocab = async (vocab: CreateVocab, userId: string): Promise<number> => {
  return db.transaction(async tx => {
    const [lesson] = await tx
      .select({ deckId: lessons.deckId })
      .from(lessons)
      .innerJoin(decks, eq(lessons.deckId, decks.id))
      .where(
        and(eq(lessons.id, vocab.lessonId), eq(decks.ownerId, userId), isNull(decks.deletedAt)),
      )
      .for('update')
      .limit(1);

    if (!lesson) throw new Error('Lesson not found or access denied.');

    const [order] = await tx
      .select({
        nextIndex: sql<number>`coalesce(max(${vocabs.orderIndex}), -1) + 1`,
      })
      .from(vocabs)
      .where(eq(vocabs.lessonId, vocab.lessonId));

    await tx.insert(vocabs).values({
      lessonId: vocab.lessonId,
      front: vocab.front,
      back: vocab.back,
      frontAlternatives: vocab.frontAlternatives,
      backAlternatives: vocab.backAlternatives,
      reading: vocab.reading,
      tags: vocab.tags,
      metadata: vocab.metadata,
      notes: vocab.notes,
      orderIndex: Number(order.nextIndex),
    });
    return lesson.deckId;
  });
};

export const moveVocab = async (
  vocabId: number,
  userId: string,
  direction: OrderDirection,
): Promise<number> => {
  return db.transaction(async tx => {
    const [targetVocab] = await tx
      .select({ lessonId: vocabs.lessonId, deckId: lessons.deckId })
      .from(vocabs)
      .innerJoin(lessons, eq(vocabs.lessonId, lessons.id))
      .innerJoin(decks, eq(lessons.deckId, decks.id))
      .where(and(eq(vocabs.id, vocabId), eq(decks.ownerId, userId), isNull(decks.deletedAt)))
      .for('update')
      .limit(1);

    if (!targetVocab) {
      throw new Error('Vocabulary not found or access denied');
    }

    const orderedVocabs = await tx
      .select({ id: vocabs.id, orderIndex: vocabs.orderIndex })
      .from(vocabs)
      .where(eq(vocabs.lessonId, targetVocab.lessonId))
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

export const updateVocab = async (
  vocabId: number,
  vocab: UpdateVocabInput,
  userId: string,
): Promise<number> => {
  return db.transaction(async tx => {
    const [target] = await tx
      .select({ deckId: lessons.deckId })
      .from(vocabs)
      .innerJoin(lessons, eq(vocabs.lessonId, lessons.id))
      .innerJoin(decks, eq(lessons.deckId, decks.id))
      .where(and(eq(vocabs.id, vocabId), eq(decks.ownerId, userId), isNull(decks.deletedAt)))
      .for('update')
      .limit(1);
    if (!target) throw new Error('Vocabulary not found or access denied.');

    await tx
      .update(vocabs)
      .set({
        front: vocab.front,
        back: vocab.back,
        frontAlternatives: vocab.frontAlternatives,
        backAlternatives: vocab.backAlternatives,
        reading: vocab.reading,
        ...(vocab.tags === undefined ? {} : { tags: vocab.tags }),
        ...(vocab.metadata === undefined ? {} : { metadata: vocab.metadata }),
        ...(vocab.notes === undefined ? {} : { notes: vocab.notes }),
        updatedAt: new Date(),
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
      .where(and(eq(vocabs.id, vocabId), eq(decks.ownerId, userId), isNull(decks.deletedAt)))
      .for('update')
      .limit(1);
    if (!target) throw new Error('Vocabulary not found or access denied.');

    await tx.delete(vocabs).where(eq(vocabs.id, vocabId));
    return target.deckId;
  });
};
