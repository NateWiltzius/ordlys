import { db } from '@/db';
import { lessons, vocabs } from '@/db/schema';
import { CreateVocab, Vocab } from '@/types/vocab.types';
import { eq, getTableColumns } from 'drizzle-orm';

export const getVocabByLessonId = async (lessonId: number): Promise<Vocab[]> => {
  return await db.select().from(vocabs).where(eq(vocabs.lessonId, lessonId));
};

export const getVocabByDeckId = async (deckId: number): Promise<Vocab[]> => {
  return await db
    .select({ ...getTableColumns(vocabs) })
    .from(vocabs)
    .innerJoin(lessons, eq(vocabs.lessonId, lessons.id))
    .where(eq(lessons.deckId, deckId));
};

export const createVocab = async (vocab: CreateVocab): Promise<void> => {
  await db.insert(vocabs).values({
    lessonId: vocab.lessonId,
    front: vocab.front,
    back: vocab.back,
    frontAlternatives: vocab.frontAlternatives,
    backAlternatives: vocab.backAlternatives,
    reading: vocab.reading,
  });
};
