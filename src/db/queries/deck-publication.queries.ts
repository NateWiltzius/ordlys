import { db } from '@/db';
import {
  deckAuditEvents,
  deckReleases,
  decks,
  lessonRevisions,
  lessons,
  releaseLessons,
  releaseVocabs,
  vocabRevisions,
  vocabs,
} from '@/db/schema';
import { vocabContentValues } from '@/db/queries/vocab-content';
import { DECK_LIMITS } from '@/config/deck-limits';
import { assertActive, canonicalReleaseHash, DeckDomainError } from '@/lib/deck-domain';
import { and, asc, count, eq, gte, isNull, sql } from 'drizzle-orm';

export async function publishDeck(
  deckId: number,
  actorId: string,
  changeSummary: string,
  idempotencyKey: string,
) {
  return db.transaction(async tx => {
    const [prior] = await tx
      .select({ releaseId: deckAuditEvents.metadata })
      .from(deckAuditEvents)
      .where(
        and(
          eq(deckAuditEvents.actorId, actorId),
          eq(deckAuditEvents.eventType, 'deck.published'),
          eq(deckAuditEvents.idempotencyKey, idempotencyKey),
        ),
      )
      .limit(1);
    if (prior && typeof prior.releaseId.releaseId === 'number') return prior.releaseId.releaseId;

    const [deck] = await tx
      .select()
      .from(decks)
      .where(and(eq(decks.id, deckId), eq(decks.ownerId, actorId)))
      .for('update')
      .limit(1);
    if (!deck) throw new DeckDomainError('NOT_OWNER', 'Deck not found or access denied.');
    assertActive(deck.status, 'publish');

    const [concurrentPrior] = await tx
      .select({ metadata: deckAuditEvents.metadata })
      .from(deckAuditEvents)
      .where(
        and(
          eq(deckAuditEvents.actorId, actorId),
          eq(deckAuditEvents.eventType, 'deck.published'),
          eq(deckAuditEvents.idempotencyKey, idempotencyKey),
        ),
      )
      .limit(1);
    if (concurrentPrior && typeof concurrentPrior.metadata.releaseId === 'number') {
      return concurrentPrior.metadata.releaseId;
    }

    const [publicationCount] = await tx
      .select({ value: count(deckAuditEvents.id) })
      .from(deckAuditEvents)
      .where(
        and(
          eq(deckAuditEvents.actorId, actorId),
          eq(deckAuditEvents.eventType, 'deck.published'),
          gte(deckAuditEvents.createdAt, new Date(Date.now() - 86_400_000)),
        ),
      );
    if (Number(publicationCount.value) >= DECK_LIMITS.publicationsPerDay) {
      throw new DeckDomainError('PUBLICATION_RATE_LIMIT', 'Daily publication limit reached.');
    }

    const draftLessons = await tx
      .select({ lesson: lessons, revision: lessonRevisions })
      .from(lessons)
      .innerJoin(lessonRevisions, eq(lessonRevisions.id, lessons.currentRevisionId))
      .where(and(eq(lessons.deckId, deckId), isNull(lessons.removedAt)))
      .orderBy(asc(lessons.orderIndex), asc(lessons.id));
    const draftVocabs = await tx
      .select({ vocab: vocabs, revision: vocabRevisions })
      .from(vocabs)
      .innerJoin(lessons, eq(vocabs.lessonId, lessons.id))
      .innerJoin(vocabRevisions, eq(vocabRevisions.id, vocabs.currentRevisionId))
      .where(and(eq(lessons.deckId, deckId), isNull(lessons.removedAt), isNull(vocabs.removedAt)))
      .orderBy(asc(lessons.orderIndex), asc(vocabs.orderIndex), asc(vocabs.id));
    if (draftVocabs.length > DECK_LIMITS.maximumReleaseCards) {
      throw new DeckDomainError('RELEASE_TOO_LARGE', 'Release exceeds the card limit.');
    }
    if (
      draftLessons.some(item => !item.lesson.currentRevisionId) ||
      draftVocabs.some(item => !item.vocab.currentRevisionId)
    ) {
      throw new DeckDomainError(
        'INVALID_DRAFT',
        'Draft contains content without an immutable revision.',
      );
    }

    const snapshot = {
      lessons: draftLessons.map(({ lesson, revision }) => ({
        title: revision.title,
        order: lesson.orderIndex,
        vocabs: draftVocabs
          .filter(row => row.vocab.lessonId === lesson.id)
          .map(row => ({
            ...vocabContentValues(row.revision),
            order: row.vocab.orderIndex,
          })),
      })),
    };
    if (
      !deck.title.trim() ||
      snapshot.lessons.some(
        lesson =>
          !lesson.title.trim() ||
          lesson.vocabs.some(vocab => !vocab.front.trim() || !vocab.back.trim()),
      )
    ) {
      throw new DeckDomainError('INVALID_DRAFT', 'Draft titles and vocabulary text are required.');
    }

    const lessonOrders = snapshot.lessons.map(lesson => lesson.order);
    if (new Set(lessonOrders).size !== lessonOrders.length) {
      throw new DeckDomainError('INVALID_DRAFT', 'Draft lesson order is ambiguous.');
    }

    let contentHash = canonicalReleaseHash(snapshot);
    if (deck.currentReleaseId) {
      const [[previous], previousLessons, previousVocabs] = await Promise.all([
        tx.select().from(deckReleases).where(eq(deckReleases.id, deck.currentReleaseId)).limit(1),
        tx
          .select()
          .from(releaseLessons)
          .where(eq(releaseLessons.releaseId, deck.currentReleaseId))
          .orderBy(releaseLessons.orderIndex, releaseLessons.lessonId),
        tx
          .select()
          .from(releaseVocabs)
          .where(eq(releaseVocabs.releaseId, deck.currentReleaseId))
          .orderBy(releaseVocabs.lessonId, releaseVocabs.orderIndex, releaseVocabs.vocabId),
      ]);
      const lessonsUnchanged =
        previousLessons.length === draftLessons.length &&
        previousLessons.every((item, index) => {
          const draft = draftLessons[index].lesson;
          return (
            item.lessonId === draft.id &&
            item.revisionId === draft.currentRevisionId &&
            item.orderIndex === draft.orderIndex
          );
        });
      const orderedDraftVocabs = [...draftVocabs].sort(
        (a, b) =>
          a.vocab.lessonId - b.vocab.lessonId ||
          a.vocab.orderIndex - b.vocab.orderIndex ||
          a.vocab.id - b.vocab.id,
      );
      const vocabsUnchanged =
        previousVocabs.length === orderedDraftVocabs.length &&
        previousVocabs.every((item, index) => {
          const draft = orderedDraftVocabs[index].vocab;
          return (
            item.lessonId === draft.lessonId &&
            item.vocabId === draft.id &&
            item.revisionId === draft.currentRevisionId &&
            item.orderIndex === draft.orderIndex
          );
        });
      if (previous && lessonsUnchanged && vocabsUnchanged) {
        contentHash = previous.contentHash;
      }
    }

    const [release] = await tx
      .insert(deckReleases)
      .values({
        deckId,
        version: sql`coalesce((select max(version) from deck_releases where deck_id = ${deckId}), 0) + 1`,
        title: deck.title,
        description: deck.description,
        copyPolicy: deck.copyPolicy,
        contentHash,
        changeSummary,
        creatorId: actorId,
      })
      .returning({ id: deckReleases.id });
    if (draftLessons.length) {
      await tx.insert(releaseLessons).values(
        draftLessons.map(({ lesson }) => ({
          releaseId: release.id,
          lessonId: lesson.id,
          revisionId: lesson.currentRevisionId as number,
          orderIndex: lesson.orderIndex,
        })),
      );
    }
    if (draftVocabs.length) {
      await tx.insert(releaseVocabs).values(
        draftVocabs.map(({ vocab }) => ({
          releaseId: release.id,
          lessonId: vocab.lessonId,
          vocabId: vocab.id,
          revisionId: vocab.currentRevisionId as number,
          orderIndex: vocab.orderIndex,
        })),
      );
    }

    let catalogStatus = deck.catalogStatus;
    if (
      deck.visibility !== 'private' &&
      deck.sourceReleaseId &&
      deck.catalogStatus !== 'under_review'
    ) {
      const duplicateRows = await tx.execute(sql`
        select true from decks other
        join deck_releases published on published.id=other.current_release_id
        where other.id <> ${deckId}
          and coalesce(other.root_deck_id,other.id)=${deck.rootDeckId ?? deck.id}
          and published.content_hash=${contentHash}
          and other.visibility in ('public','unlisted') and other.status='active'
        limit 1
      `);
      catalogStatus = duplicateRows.length ? 'duplicate' : 'eligible';
    }

    await tx
      .update(decks)
      .set({ currentReleaseId: release.id, catalogStatus, updatedAt: new Date() })
      .where(eq(decks.id, deckId));
    await tx.insert(deckAuditEvents).values({
      deckId,
      actorId,
      eventType: 'deck.published',
      idempotencyKey,
      metadata: { releaseId: release.id },
    });
    return release.id;
  });
}
