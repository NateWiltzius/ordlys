import { db } from '@/db';
import { decks, lessonRevisions, lessons, vocabRevisions, vocabs } from '@/db/schema';
import { and, asc, eq, isNull, ne } from 'drizzle-orm';
import { vocabRevisionContentSelection } from '@/db/queries/vocab-content';

export async function getOwnedDeckExport(deckId: number, userId: string) {
  const [deck] = await db
    .select({
      id: decks.id,
      title: decks.title,
      description: decks.description,
      frontLanguage: decks.frontLanguage,
      backLanguage: decks.backLanguage,
    })
    .from(decks)
    .where(
      and(eq(decks.id, deckId), eq(decks.ownerId, userId), ne(decks.status, 'moderation_removed')),
    )
    .limit(1);

  if (!deck) return null;

  const rows = await db
    .select({
      ...vocabRevisionContentSelection,
      lesson: lessonRevisions.title,
    })
    .from(lessons)
    .innerJoin(lessonRevisions, eq(lessonRevisions.id, lessons.currentRevisionId))
    .innerJoin(vocabs, and(eq(vocabs.lessonId, lessons.id), isNull(vocabs.removedAt)))
    .innerJoin(vocabRevisions, eq(vocabRevisions.id, vocabs.currentRevisionId))
    .where(and(eq(lessons.deckId, deckId), isNull(lessons.removedAt)))
    .orderBy(asc(lessons.orderIndex), asc(lessons.id), asc(vocabs.orderIndex), asc(vocabs.id));

  return { deck, rows };
}
