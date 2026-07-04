import { db } from '@/db';
import { decks, lessons, vocabs } from '@/db/schema';
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

export const getVocabById = async (vocabId: number): Promise<Vocab | undefined> => {
  return (await db.select().from(vocabs).where(eq(vocabs.id, vocabId)).limit(1))[0];
};

export const createVocab = async (vocab: CreateVocab): Promise<void> => {
  await db.transaction(async tx => {
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
      orderIndex: Number(order.nextIndex),
    });
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
      .limit(1);

    if (!targetVocab) {
      throw new Error('Vocabulary not found or access denied');
    }

    const orderedVocabs = await tx
      .select({ id: vocabs.id })
      .from(vocabs)
      .where(eq(vocabs.lessonId, targetVocab.lessonId))
      .orderBy(vocabs.orderIndex, vocabs.id);

    const currentIndex = orderedVocabs.findIndex(vocab => vocab.id === vocabId);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= orderedVocabs.length) {
      return targetVocab.deckId;
    }

    [orderedVocabs[currentIndex], orderedVocabs[targetIndex]] = [
      orderedVocabs[targetIndex],
      orderedVocabs[currentIndex],
    ];

    for (const [orderIndex, vocab] of orderedVocabs.entries()) {
      await tx.update(vocabs).set({ orderIndex }).where(eq(vocabs.id, vocab.id));
    }

    return targetVocab.deckId;
  });
};

export const updateVocab = async (vocabId: number, vocab: UpdateVocabInput): Promise<void> => {
  await db
    .update(vocabs)
    .set({
      front: vocab.front,
      back: vocab.back,
      frontAlternatives: vocab.frontAlternatives,
      backAlternatives: vocab.backAlternatives,
      reading: vocab.reading,
      updatedAt: new Date(),
    })
    .where(eq(vocabs.id, vocabId));
};
