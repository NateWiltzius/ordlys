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
import { and, asc, desc, eq, inArray, isNull, or, sql } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { PUBLIC_DECK_SUMMARIES_CACHE_TAG } from '@/lib/cache-tags';

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
  visibility: decks.visibility,
  lessonCount: sql<number>`(
    select count(*)::int
    from ${releaseLessons}
    where ${releaseLessons.releaseId} = ${deckReleases.id}
  )`,
  wordCount: sql<number>`(
    select count(*)::int
    from ${releaseVocabs}
    where ${releaseVocabs.releaseId} = ${deckReleases.id}
  )`,
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

export async function getPublicDeckSummaries(limit?: number, languages?: readonly string[]) {
  const languagePredicate =
    languages && languages.length > 0
      ? or(
          inArray(decks.frontLanguage, [...languages]),
          inArray(decks.backLanguage, [...languages]),
        )
      : undefined;
  const query = db
    .select(publicDeckSummarySelection)
    .from(decks)
    .innerJoin(deckReleases, eq(deckReleases.id, decks.currentReleaseId))
    .where(and(publicDeckPredicate, languagePredicate))
    .orderBy(desc(decks.updatedAt), asc(decks.id));

  if (limit === undefined) return query;

  const safeLimit = Math.max(1, Math.min(Math.trunc(limit), 24));
  return query.limit(safeLimit);
}

export const getCachedPublicDeckSummaries = unstable_cache(
  async (limit?: number, languages?: readonly string[]) => getPublicDeckSummaries(limit, languages),
  ['public-deck-summaries'],
  { revalidate: 3600, tags: [PUBLIC_DECK_SUMMARIES_CACHE_TAG] },
);

export async function getPublicDeckSummaryById(deckId: number) {
  const [deck] = await db
    .select(publicDeckSummarySelection)
    .from(decks)
    .innerJoin(deckReleases, eq(deckReleases.id, decks.currentReleaseId))
    .where(and(eq(decks.id, deckId), sharedDeckPredicate))
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

export const getCachedPublicDeckSummaryById = unstable_cache(
  async (deckId: number) => getPublicDeckSummaryById(deckId),
  ['public-deck-summary'],
  { revalidate: 3600, tags: [PUBLIC_DECK_SUMMARIES_CACHE_TAG] },
);

export const getCachedPublicDeckPageData = unstable_cache(
  async (deckId: number) => getPublicDeckPageData(deckId),
  ['public-deck-page'],
  { revalidate: 3600, tags: [PUBLIC_DECK_SUMMARIES_CACHE_TAG] },
);

export async function getPublicDeckSitemapEntries() {
  return db.select({ id: decks.id }).from(decks).where(publicDeckPredicate).orderBy(asc(decks.id));
}

export const getCachedPublicDeckSitemapEntries = unstable_cache(
  getPublicDeckSitemapEntries,
  ['public-deck-sitemap'],
  { revalidate: 3600, tags: [PUBLIC_DECK_SUMMARIES_CACHE_TAG] },
);

export type PublicDeckSummary = NonNullable<Awaited<ReturnType<typeof getPublicDeckSummaryById>>>;
