import { db } from '@/db';
import { decks, lessons } from '@/db/schema';
import { CreateLesson, Lesson } from '@/types/lesson.types';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { OrderDirection } from '@/types/order.types';

export const createLesson = async (lesson: CreateLesson, userId: string) => {
  await db.transaction(async tx => {
    const [deck] = await tx
      .select({ id: decks.id })
      .from(decks)
      .where(and(eq(decks.id, lesson.deckId), eq(decks.ownerId, userId), isNull(decks.deletedAt)))
      .for('update')
      .limit(1);

    if (!deck) {
      throw new Error('Deck not found or access denied');
    }

    const [order] = await tx
      .select({
        nextIndex: sql<number>`coalesce(max(${lessons.orderIndex}), -1) + 1`,
      })
      .from(lessons)
      .where(eq(lessons.deckId, lesson.deckId));

    await tx.insert(lessons).values({
      title: lesson.title,
      deckId: lesson.deckId,
      orderIndex: Number(order.nextIndex),
    });
  });
};

export const getLessonsByDeckId = async (deckId: number): Promise<Lesson[]> => {
  return db
    .select()
    .from(lessons)
    .where(eq(lessons.deckId, deckId))
    .orderBy(lessons.orderIndex, lessons.id);
};

export const getLessonById = async (lessonId: number): Promise<Lesson | undefined> => {
  return (await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1))[0];
};

export const deleteLesson = async (lessonId: number, userId: string): Promise<number> => {
  return db.transaction(async tx => {
    const [lesson] = await tx
      .select({ id: lessons.id, deckId: lessons.deckId })
      .from(lessons)
      .innerJoin(decks, eq(lessons.deckId, decks.id))
      .where(and(eq(lessons.id, lessonId), eq(decks.ownerId, userId), isNull(decks.deletedAt)))
      .for('update')
      .limit(1);

    if (!lesson) {
      throw new Error('Lesson not found or access denied');
    }

    await tx.delete(lessons).where(eq(lessons.id, lessonId));
    return lesson.deckId;
  });
};

export const moveLesson = async (
  lessonId: number,
  userId: string,
  direction: OrderDirection,
): Promise<number> => {
  return db.transaction(async tx => {
    const [targetLesson] = await tx
      .select({ deckId: lessons.deckId })
      .from(lessons)
      .innerJoin(decks, eq(lessons.deckId, decks.id))
      .where(and(eq(lessons.id, lessonId), eq(decks.ownerId, userId), isNull(decks.deletedAt)))
      .for('update')
      .limit(1);

    if (!targetLesson) {
      throw new Error('Lesson not found or access denied');
    }

    const orderedLessons = await tx
      .select({ id: lessons.id, orderIndex: lessons.orderIndex })
      .from(lessons)
      .where(eq(lessons.deckId, targetLesson.deckId))
      .orderBy(lessons.orderIndex, lessons.id);

    const currentIndex = orderedLessons.findIndex(lesson => lesson.id === lessonId);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= orderedLessons.length) {
      return targetLesson.deckId;
    }

    const currentLesson = orderedLessons[currentIndex];
    const adjacentLesson = orderedLessons[targetIndex];
    await tx
      .update(lessons)
      .set({ orderIndex: adjacentLesson.orderIndex })
      .where(eq(lessons.id, currentLesson.id));
    await tx
      .update(lessons)
      .set({ orderIndex: currentLesson.orderIndex })
      .where(eq(lessons.id, adjacentLesson.id));

    return targetLesson.deckId;
  });
};
