import { db } from '@/db';
import { decks, lessons, userVocabState, vocabs } from '@/db/schema';
import { CreateLesson, Lesson } from '@/types/lesson.types';
import { and, eq, inArray } from 'drizzle-orm';

export const createLesson = async (lesson: CreateLesson, userId: string) => {
  const [deck] = await db
    .select({ id: decks.id })
    .from(decks)
    .where(and(eq(decks.id, lesson.deckId), eq(decks.ownerId, userId)))
    .limit(1);

  if (!deck) {
    throw new Error('Deck not found or access denied');
  }

  await db.insert(lessons).values({
    title: lesson.title,
    deckId: lesson.deckId,
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

export const deleteLesson = async (lessonId: number, userId: string): Promise<void> => {
  await db.transaction(async tx => {
    const [lesson] = await tx
      .select({
        id: lessons.id,
      })
      .from(lessons)
      .innerJoin(decks, eq(lessons.deckId, decks.id))
      .where(and(eq(lessons.id, lessonId), eq(decks.ownerId, userId)))
      .limit(1);

    if (!lesson) {
      throw new Error('Lesson not found or access denied');
    }

    const lessonVocabs = await tx
      .select({ id: vocabs.id })
      .from(vocabs)
      .where(eq(vocabs.lessonId, lessonId));

    const vocabIds = lessonVocabs.map(vocab => vocab.id);

    if (vocabIds.length > 0) {
      await tx.delete(userVocabState).where(inArray(userVocabState.vocabId, vocabIds));
    }

    await tx.delete(vocabs).where(eq(vocabs.lessonId, lessonId));
    await tx.delete(lessons).where(eq(lessons.id, lessonId));
  });
};
