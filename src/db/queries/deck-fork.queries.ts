import { db } from '@/db';
import {
  deckAuditEvents,
  deckFollows,
  deckReleases,
  decks,
  lessonRevisions,
  lessons,
  releaseLessons,
  releaseVocabs,
  vocabRevisions,
  vocabs,
} from '@/db/schema';
import { getAuthoringUsage, lockAuthoringAccount } from '@/db/queries/authoring-quota.queries';
import { vocabContentValues } from '@/db/queries/vocab-content';
import { DECK_LIMITS } from '@/config/deck-limits';
import { assertAuthoringCapacity } from '@/lib/authoring-quota';
import { DeckDomainError } from '@/lib/deck-domain';
import { and, count, eq, gte } from 'drizzle-orm';
import { accessibleReleaseCondition } from '@/db/queries/deck-access';

export async function forkRelease(
  sourceReleaseId: number,
  actorId: string,
  idempotencyKey: string,
): Promise<number> {
  return db.transaction(async tx => {
    const [prior] = await tx
      .select({ metadata: deckAuditEvents.metadata })
      .from(deckAuditEvents)
      .where(
        and(
          eq(deckAuditEvents.actorId, actorId),
          eq(deckAuditEvents.eventType, 'deck.forked'),
          eq(deckAuditEvents.idempotencyKey, idempotencyKey),
        ),
      )
      .limit(1);
    if (prior && typeof prior.metadata.forkDeckId === 'number') {
      return prior.metadata.forkDeckId;
    }

    const [source] = await tx
      .select({ release: deckReleases, deck: decks })
      .from(deckReleases)
      .innerJoin(decks, eq(deckReleases.deckId, decks.id))
      .leftJoin(deckFollows, and(eq(deckFollows.deckId, decks.id), eq(deckFollows.userId, actorId)))
      .where(
        and(
          eq(deckReleases.id, sourceReleaseId),
          eq(decks.status, 'active'),
          accessibleReleaseCondition(actorId, true),
        ),
      )
      .for('update', { of: decks })
      .limit(1);
    if (!source) {
      throw new DeckDomainError('RELEASE_INACCESSIBLE', 'Source release is unavailable.');
    }
    if (source.release.copyPolicy === 'follow_only') {
      throw new DeckDomainError('FORK_FORBIDDEN', 'This release does not permit forks.');
    }

    await lockAuthoringAccount(tx, actorId);
    const authoringUsage = await getAuthoringUsage(tx, actorId);
    assertAuthoringCapacity(authoringUsage, { activeDecks: 1 });

    const now = new Date();
    const dayAgo = new Date(now.getTime() - 86_400_000);
    const hourAgo = new Date(now.getTime() - 3_600_000);
    const [[daily], [hourly]] = await Promise.all([
      tx
        .select({ value: count(deckAuditEvents.id) })
        .from(deckAuditEvents)
        .where(
          and(
            eq(deckAuditEvents.actorId, actorId),
            eq(deckAuditEvents.eventType, 'deck.forked'),
            gte(deckAuditEvents.createdAt, dayAgo),
          ),
        ),
      tx
        .select({ value: count(deckAuditEvents.id) })
        .from(deckAuditEvents)
        .where(
          and(
            eq(deckAuditEvents.actorId, actorId),
            eq(deckAuditEvents.eventType, 'deck.forked'),
            gte(deckAuditEvents.createdAt, hourAgo),
          ),
        ),
    ]);
    if (
      Number(daily.value) >= DECK_LIMITS.forksPerDay ||
      Number(hourly.value) >= DECK_LIMITS.forksPerHour
    ) {
      throw new DeckDomainError('FORK_RATE_LIMIT', 'Fork rate limit reached.');
    }

    const sourceLessonRows = await tx
      .select({ membership: releaseLessons, revision: lessonRevisions })
      .from(releaseLessons)
      .innerJoin(lessonRevisions, eq(releaseLessons.revisionId, lessonRevisions.id))
      .where(eq(releaseLessons.releaseId, sourceReleaseId))
      .orderBy(releaseLessons.orderIndex, releaseLessons.lessonId);
    const sourceVocabRows = await tx
      .select({ membership: releaseVocabs, revision: vocabRevisions, logical: vocabs })
      .from(releaseVocabs)
      .innerJoin(vocabRevisions, eq(releaseVocabs.revisionId, vocabRevisions.id))
      .innerJoin(vocabs, eq(releaseVocabs.vocabId, vocabs.id))
      .where(eq(releaseVocabs.releaseId, sourceReleaseId))
      .orderBy(releaseVocabs.orderIndex, releaseVocabs.vocabId);
    assertAuthoringCapacity(
      authoringUsage,
      { deckCards: sourceVocabRows.length, logicalVocabs: sourceVocabRows.length },
      {
        deckCards: { code: 'VOCAB_QUOTA', message: 'Vocabulary quota reached.' },
        logicalVocabs: { message: 'Vocabulary quota reached.' },
      },
    );

    const [fork] = await tx
      .insert(decks)
      .values({
        ownerId: actorId,
        title: source.release.title,
        description: source.release.description,
        frontLanguage: source.deck.frontLanguage,
        backLanguage: source.deck.backLanguage,
        visibility: 'private',
        status: 'active',
        copyPolicy: source.release.copyPolicy,
        catalogStatus: 'eligible',
        rootDeckId: source.deck.rootDeckId ?? source.deck.id,
        sourceDeckId: source.deck.id,
        sourceReleaseId,
      })
      .returning({ id: decks.id });

    const lessonMap = new Map<number, number>();
    for (const row of sourceLessonRows) {
      const [created] = await tx
        .insert(lessons)
        .values({
          deckId: fork.id,
          title: row.revision.title,
          currentRevisionId: row.revision.id,
          orderIndex: row.membership.orderIndex,
        })
        .returning({ id: lessons.id });
      lessonMap.set(row.membership.lessonId, created.id);
    }

    const forkVocabs: Array<{
      id: number;
      lessonId: number;
      revisionId: number;
      orderIndex: number;
    }> = [];
    for (const row of sourceVocabRows) {
      const lessonId = lessonMap.get(row.membership.lessonId);
      if (!lessonId) {
        throw new DeckDomainError('INVALID_RELEASE', 'Release vocabulary has no lesson.');
      }
      const [created] = await tx
        .insert(vocabs)
        .values({
          lessonId,
          sourceVocabId: row.logical.id,
          rootVocabId: row.logical.rootVocabId ?? row.logical.id,
          currentRevisionId: row.revision.id,
          ...vocabContentValues(row.revision),
          orderIndex: row.membership.orderIndex,
        })
        .returning({ id: vocabs.id });
      forkVocabs.push({
        id: created.id,
        lessonId,
        revisionId: row.revision.id,
        orderIndex: row.membership.orderIndex,
      });
    }

    const [initialRelease] = await tx
      .insert(deckReleases)
      .values({
        deckId: fork.id,
        version: 1,
        title: source.release.title,
        description: source.release.description,
        copyPolicy: source.release.copyPolicy,
        contentHash: source.release.contentHash,
        changeSummary: `Forked from release ${source.release.version}`,
        derivedFromReleaseId: sourceReleaseId,
        creatorId: actorId,
      })
      .returning({ id: deckReleases.id });
    if (sourceLessonRows.length) {
      await tx.insert(releaseLessons).values(
        sourceLessonRows.map(row => ({
          releaseId: initialRelease.id,
          lessonId: lessonMap.get(row.membership.lessonId) as number,
          revisionId: row.revision.id,
          orderIndex: row.membership.orderIndex,
        })),
      );
    }
    if (forkVocabs.length) {
      await tx.insert(releaseVocabs).values(
        forkVocabs.map(item => ({
          releaseId: initialRelease.id,
          vocabId: item.id,
          lessonId: item.lessonId,
          revisionId: item.revisionId,
          orderIndex: item.orderIndex,
        })),
      );
    }

    await tx
      .update(decks)
      .set({ currentReleaseId: initialRelease.id })
      .where(eq(decks.id, fork.id));
    await tx.insert(deckAuditEvents).values({
      deckId: fork.id,
      actorId,
      eventType: 'deck.forked',
      idempotencyKey,
      metadata: {
        forkDeckId: fork.id,
        sourceDeckId: source.deck.id,
        sourceReleaseId,
        rootDeckId: source.deck.rootDeckId ?? source.deck.id,
      },
    });
    return fork.id;
  });
}
