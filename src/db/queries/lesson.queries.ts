import { db } from '@/db';
import { decks, lessonRevisions, lessons, vocabs } from '@/db/schema';
import { CreateLesson, EditLessonSummary, Lesson } from '@/types/lesson.types';
import { and, count, eq, isNull, sql } from 'drizzle-orm';
import { OrderDirection } from '@/types/order.types';
import { DeckDomainError } from '@/lib/deck-domain';
import { assertAuthoringCapacity } from '@/lib/authoring-quota';
import { getAuthoringUsage, lockAuthoringAccount } from '@/db/queries/authoring-quota.queries';
import {
  activeEditableLessonCondition,
  activeOwnedDeckCondition,
} from '@/db/queries/authoring-access';

export const createLesson = async (lesson: CreateLesson, userId: string) => {
  await db.transaction(async tx => {
    await lockAuthoringAccount(tx, userId);
    const [deck] = await tx
      .select({ id: decks.id })
      .from(decks)
      .where(and(eq(decks.id, lesson.deckId), activeOwnedDeckCondition(userId)))
      .for('update')
      .limit(1);

    if (!deck) {
      throw new Error('Deck not found or access denied');
    }
    assertAuthoringCapacity(await getAuthoringUsage(tx, userId, lesson.deckId), {
      revisionsToday: 1,
    });

    const [order] = await tx
      .select({
        nextIndex: sql<number>`coalesce(max(${lessons.orderIndex}), -1) + 1`,
      })
      .from(lessons)
      .where(eq(lessons.deckId, lesson.deckId));

    const [created] = await tx
      .insert(lessons)
      .values({
        title: lesson.title,
        deckId: lesson.deckId,
        orderIndex: Number(order.nextIndex),
      })
      .returning({ id: lessons.id });
    const [revision] = await tx
      .insert(lessonRevisions)
      .values({ lessonId: created.id, title: lesson.title, creatorId: userId })
      .returning({ id: lessonRevisions.id });
    await tx
      .update(lessons)
      .set({ currentRevisionId: revision.id })
      .where(eq(lessons.id, created.id));
  });
};

export const getEditLessonSummaries = async (deckId: number): Promise<EditLessonSummary[]> => {
  const rows = await db
    .select({
      id: lessons.id,
      deckId: lessons.deckId,
      title: lessonRevisions.title,
      currentRevisionId: lessons.currentRevisionId,
      removedAt: lessons.removedAt,
      orderIndex: lessons.orderIndex,
      createdAt: lessons.createdAt,
      updatedAt: lessons.updatedAt,
      vocabCount: count(vocabs.id),
    })
    .from(lessons)
    .innerJoin(lessonRevisions, eq(lessonRevisions.id, lessons.currentRevisionId))
    .leftJoin(vocabs, and(eq(vocabs.lessonId, lessons.id), isNull(vocabs.removedAt)))
    .where(and(eq(lessons.deckId, deckId), isNull(lessons.removedAt)))
    .groupBy(
      lessons.id,
      lessons.deckId,
      lessonRevisions.title,
      lessons.currentRevisionId,
      lessons.removedAt,
      lessons.orderIndex,
      lessons.createdAt,
      lessons.updatedAt,
    )
    .orderBy(lessons.orderIndex, lessons.id);

  return rows.map(row => ({ ...row, vocabCount: Number(row.vocabCount) }));
};

export const updateLesson = async (lessonId: number, title: string, userId: string) => {
  return db.transaction(async tx => {
    await lockAuthoringAccount(tx, userId);
    const [target] = await tx
      .select({ deckId: lessons.deckId })
      .from(lessons)
      .innerJoin(decks, eq(lessons.deckId, decks.id))
      .where(activeEditableLessonCondition(lessonId, userId))
      .for('update', { of: lessons })
      .limit(1);
    if (!target) throw new Error('Lesson not found or access denied.');
    assertAuthoringCapacity(await getAuthoringUsage(tx, userId, target.deckId), {
      revisionsToday: 1,
    });
    const [revision] = await tx
      .insert(lessonRevisions)
      .values({ lessonId, title, creatorId: userId })
      .returning({ id: lessonRevisions.id });
    await tx
      .update(lessons)
      .set({ title, currentRevisionId: revision.id, updatedAt: new Date() })
      .where(eq(lessons.id, lessonId));
    return target.deckId;
  });
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
      .where(activeEditableLessonCondition(lessonId, userId))
      .for('update')
      .limit(1);

    if (!lesson) {
      throw new Error('Lesson not found or access denied');
    }

    await tx
      .update(lessons)
      .set({ removedAt: new Date(), updatedAt: new Date() })
      .where(eq(lessons.id, lessonId));
    return lesson.deckId;
  });
};

export const restoreLesson = async (lessonId: number, userId: string): Promise<number> => {
  return db.transaction(async tx => {
    const [target] = await tx
      .select({ deckId: lessons.deckId })
      .from(lessons)
      .innerJoin(decks, eq(decks.id, lessons.deckId))
      .where(
        and(
          eq(lessons.id, lessonId),
          eq(decks.ownerId, userId),
          eq(decks.status, 'active'),
          sql`${lessons.removedAt} is not null`,
        ),
      )
      .for('update', { of: lessons })
      .limit(1);
    if (!target) throw new DeckDomainError('LESSON_NOT_FOUND', 'Removed lesson not found.');
    await tx
      .update(lessons)
      .set({ removedAt: null, updatedAt: new Date() })
      .where(eq(lessons.id, lessonId));
    return target.deckId;
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
      .where(activeEditableLessonCondition(lessonId, userId))
      .for('update')
      .limit(1);

    if (!targetLesson) {
      throw new Error('Lesson not found or access denied');
    }

    const orderedLessons = await tx
      .select({ id: lessons.id, orderIndex: lessons.orderIndex })
      .from(lessons)
      .where(and(eq(lessons.deckId, targetLesson.deckId), isNull(lessons.removedAt)))
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
