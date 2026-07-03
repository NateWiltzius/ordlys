import { db } from '@/db';
import { lessons, userVocabState, vocabs } from '@/db/schema';
import { CreateLesson, Lesson } from '@/types/lesson.types';
import { eq, inArray } from 'drizzle-orm';

export const createLesson = async (lesson: CreateLesson) => {
  await db.insert(lessons).values({
    title: lesson.title,
    deckId: lesson.deckId,
  });
};

export const getLessonsByDeckId = async (deckId: number): Promise<Lesson[]> => {
  return await db.select().from(lessons).where(eq(lessons.deckId, deckId));
};

export const getLessonById = async (lessonId: number): Promise<Lesson | undefined> => {
  return (await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1))[0];
};

export const deleteLesson = async (lessonId: number): Promise<void> => {
  await db.transaction(async tx => {
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
