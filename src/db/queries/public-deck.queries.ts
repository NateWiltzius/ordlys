import { db } from '@/db';
import {
  deckReleases,
  deckFollows,
  decks,
  lessonRevisions,
  releaseLessons,
  releaseVocabs,
  vocabRevisions,
} from '@/db/schema';
import { and, asc, desc, eq, inArray, isNull, sql } from 'drizzle-orm';

const PUBLIC_VOCABULARY_PREVIEW_LIMIT = 20;

const publicDeckSummarySelection = {
  id: decks.id,
  title: deckReleases.title,
  description: deckReleases.description,
  frontLanguage: decks.frontLanguage,
  backLanguage: decks.backLanguage,
  updatedAt: decks.updatedAt,
  rootDeckId: decks.rootDeckId,
  sourceDeckId: decks.sourceDeckId,
  sourceReleaseId: decks.sourceReleaseId,
  lessonCount: sql<number>`count(distinct ${releaseLessons.lessonId})::int`,
  wordCount: sql<number>`count(distinct ${releaseVocabs.vocabId})::int`,
  subscriberCount: sql<number>`(
    select count(*)::int
    from ${deckFollows} follows
    where follows.deck_id = ${decks.id} and follows.status = 'active'
  )`,
};

const publicDeckPredicate = and(
  eq(decks.visibility, 'public'),
  eq(decks.status, 'active'),
  eq(decks.catalogStatus, 'eligible'),
  isNull(decks.deletedAt),
);
const sharedDeckPredicate = and(
  inArray(decks.visibility, ['public', 'unlisted']),
  eq(decks.status, 'active'),
  inArray(decks.catalogStatus, ['eligible', 'duplicate']),
  isNull(decks.deletedAt),
);

export async function getPublicDeckSummaries(limit?: number) {
  const query = db
    .select(publicDeckSummarySelection)
    .from(decks)
    .innerJoin(deckReleases, eq(deckReleases.id, decks.currentReleaseId))
    .leftJoin(releaseLessons, eq(releaseLessons.releaseId, deckReleases.id))
    .leftJoin(releaseVocabs, eq(releaseVocabs.releaseId, deckReleases.id))
    .where(publicDeckPredicate)
    .groupBy(
      decks.id,
      deckReleases.title,
      deckReleases.description,
      decks.frontLanguage,
      decks.backLanguage,
      decks.updatedAt,
      decks.rootDeckId,
      decks.sourceDeckId,
      decks.sourceReleaseId,
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
    .innerJoin(deckReleases, eq(deckReleases.id, decks.currentReleaseId))
    .leftJoin(releaseLessons, eq(releaseLessons.releaseId, deckReleases.id))
    .leftJoin(releaseVocabs, eq(releaseVocabs.releaseId, deckReleases.id))
    .where(and(eq(decks.id, deckId), sharedDeckPredicate))
    .groupBy(
      decks.id,
      deckReleases.title,
      deckReleases.description,
      decks.frontLanguage,
      decks.backLanguage,
      decks.updatedAt,
      decks.rootDeckId,
      decks.sourceDeckId,
      decks.sourceReleaseId,
    )
    .limit(1);

  return deck;
}

export async function getPublicDeckPageData(deckId: number) {
  const [deck, lessonRows, vocabularyPreview, provenance] = await Promise.all([
    getPublicDeckSummaryById(deckId),
    db
      .select({
        id: releaseLessons.lessonId,
        title: lessonRevisions.title,
        orderIndex: releaseLessons.orderIndex,
        wordCount: sql<number>`count(${releaseVocabs.vocabId})::int`,
      })
      .from(decks)
      .innerJoin(deckReleases, eq(deckReleases.id, decks.currentReleaseId))
      .innerJoin(releaseLessons, eq(releaseLessons.releaseId, deckReleases.id))
      .innerJoin(lessonRevisions, eq(lessonRevisions.id, releaseLessons.revisionId))
      .leftJoin(
        releaseVocabs,
        and(
          eq(releaseVocabs.releaseId, deckReleases.id),
          eq(releaseVocabs.lessonId, releaseLessons.lessonId),
        ),
      )
      .where(and(eq(decks.id, deckId), sharedDeckPredicate))
      .groupBy(releaseLessons.lessonId, lessonRevisions.title, releaseLessons.orderIndex)
      .orderBy(asc(releaseLessons.orderIndex), asc(releaseLessons.lessonId)),
    db
      .select({
        id: releaseVocabs.vocabId,
        lessonId: releaseLessons.lessonId,
        lessonTitle: lessonRevisions.title,
        front: vocabRevisions.front,
        back: vocabRevisions.back,
        reading: vocabRevisions.reading,
      })
      .from(decks)
      .innerJoin(deckReleases, eq(deckReleases.id, decks.currentReleaseId))
      .innerJoin(releaseLessons, eq(releaseLessons.releaseId, deckReleases.id))
      .innerJoin(lessonRevisions, eq(lessonRevisions.id, releaseLessons.revisionId))
      .innerJoin(
        releaseVocabs,
        and(
          eq(releaseVocabs.releaseId, deckReleases.id),
          eq(releaseVocabs.lessonId, releaseLessons.lessonId),
        ),
      )
      .innerJoin(vocabRevisions, eq(vocabRevisions.id, releaseVocabs.revisionId))
      .where(and(eq(decks.id, deckId), sharedDeckPredicate))
      .orderBy(
        asc(releaseLessons.orderIndex),
        asc(releaseVocabs.orderIndex),
        asc(releaseVocabs.vocabId),
      )
      .limit(PUBLIC_VOCABULARY_PREVIEW_LIMIT),
    db
      .select({
        sourceDeckId: deckReleases.deckId,
        sourceReleaseId: deckReleases.id,
        sourceVersion: deckReleases.version,
        sourceTitle: deckReleases.title,
      })
      .from(decks)
      .innerJoin(deckReleases, eq(deckReleases.id, decks.sourceReleaseId))
      .where(eq(decks.id, deckId))
      .limit(1)
      .then(rows => rows[0] ?? null),
  ]);

  if (!deck) return null;
  const rootDeckId = deck.rootDeckId ?? deck.id;
  const communityVariants = await db
    .select({
      id: decks.id,
      title: deckReleases.title,
      description: deckReleases.description,
      catalogStatus: decks.catalogStatus,
    })
    .from(decks)
    .innerJoin(deckReleases, eq(deckReleases.id, decks.currentReleaseId))
    .where(
      and(
        eq(decks.rootDeckId, rootDeckId),
        sql`${decks.id} <> ${deck.id}`,
        eq(decks.visibility, 'public'),
        eq(decks.status, 'active'),
        inArray(decks.catalogStatus, ['eligible', 'duplicate']),
      ),
    )
    .orderBy(desc(deckReleases.createdAt));

  return {
    ...deck,
    lessons: lessonRows,
    vocabularyPreview,
    provenance,
    communityVariants,
  };
}

export async function getPublicDeckSitemapEntries() {
  return db.select({ id: decks.id }).from(decks).where(publicDeckPredicate).orderBy(asc(decks.id));
}

export type PublicDeckSummary = NonNullable<Awaited<ReturnType<typeof getPublicDeckSummaryById>>>;
