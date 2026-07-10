import { db } from '@/db';
import { decks, lessons, vocabs } from '@/db/schema';
import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm';

const PUBLIC_VOCABULARY_PREVIEW_LIMIT = 20;

const publicDeckSummarySelection = {
  id: decks.id,
  title: decks.title,
  description: decks.description,
  frontLanguage: decks.frontLanguage,
  backLanguage: decks.backLanguage,
  updatedAt: decks.updatedAt,
  lessonCount: sql<number>`count(distinct ${lessons.id})::int`,
  wordCount: sql<number>`count(distinct ${vocabs.id})::int`,
};

const publicDeckPredicate = and(eq(decks.visibility, 'public'), isNull(decks.deletedAt));

export async function getPublicDeckSummaries(limit?: number) {
  const query = db
    .select(publicDeckSummarySelection)
    .from(decks)
    .leftJoin(lessons, eq(lessons.deckId, decks.id))
    .leftJoin(vocabs, eq(vocabs.lessonId, lessons.id))
    .where(publicDeckPredicate)
    .groupBy(
      decks.id,
      decks.title,
      decks.description,
      decks.frontLanguage,
      decks.backLanguage,
      decks.updatedAt,
    )
    .orderBy(desc(decks.updatedAt), asc(decks.id));

  if (limit === undefined) return query;

  const safeLimit = Math.max(1, Math.min(Math.trunc(limit), 24));
  return query.limit(safeLimit);
}

export async function getPublicDeckSummaryById(deckId: number) {
  const [deck] = await db
    .select(publicDeckSummarySelection)
    .from(decks)
    .leftJoin(lessons, eq(lessons.deckId, decks.id))
    .leftJoin(vocabs, eq(vocabs.lessonId, lessons.id))
    .where(and(eq(decks.id, deckId), publicDeckPredicate))
    .groupBy(
      decks.id,
      decks.title,
      decks.description,
      decks.frontLanguage,
      decks.backLanguage,
      decks.updatedAt,
    )
    .limit(1);

  return deck;
}

export async function getPublicDeckPageData(deckId: number) {
  const [deck, lessonRows, vocabularyPreview] = await Promise.all([
    getPublicDeckSummaryById(deckId),
    db
      .select({
        id: lessons.id,
        title: lessons.title,
        orderIndex: lessons.orderIndex,
        wordCount: sql<number>`count(${vocabs.id})::int`,
      })
      .from(lessons)
      .innerJoin(decks, eq(lessons.deckId, decks.id))
      .leftJoin(vocabs, eq(vocabs.lessonId, lessons.id))
      .where(and(eq(decks.id, deckId), publicDeckPredicate))
      .groupBy(lessons.id, lessons.title, lessons.orderIndex)
      .orderBy(asc(lessons.orderIndex), asc(lessons.id)),
    db
      .select({
        id: vocabs.id,
        lessonId: lessons.id,
        lessonTitle: lessons.title,
        front: vocabs.front,
        back: vocabs.back,
        reading: vocabs.reading,
      })
      .from(vocabs)
      .innerJoin(lessons, eq(vocabs.lessonId, lessons.id))
      .innerJoin(decks, eq(lessons.deckId, decks.id))
      .where(and(eq(decks.id, deckId), publicDeckPredicate))
      .orderBy(asc(lessons.orderIndex), asc(vocabs.orderIndex), asc(vocabs.id))
      .limit(PUBLIC_VOCABULARY_PREVIEW_LIMIT),
  ]);

  if (!deck) return null;

  return {
    ...deck,
    lessons: lessonRows,
    vocabularyPreview,
  };
}

export async function getPublicDeckSitemapEntries() {
  return db.select({ id: decks.id }).from(decks).where(publicDeckPredicate).orderBy(asc(decks.id));
}

export type PublicDeckSummary = NonNullable<Awaited<ReturnType<typeof getPublicDeckSummaryById>>>;
