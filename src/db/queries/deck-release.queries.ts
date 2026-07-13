import { db } from '@/db';
import {
  deckAuditEvents,
  deckFollows,
  deckReleases,
  deckReports,
  decks,
  lessonRevisions,
  lessons,
  releaseLessons,
  releaseVocabs,
  vocabRevisions,
  vocabs,
} from '@/db/schema';
import { and, asc, count, desc, eq, getTableColumns, gte, isNull, ne, or, sql } from 'drizzle-orm';
import {
  assertActive,
  assertPolicyInheritance,
  canonicalReleaseHash,
  type CopyPolicy,
  type DeckVisibility,
  DeckDomainError,
} from '@/lib/deck-domain';
import { DECK_LIMITS } from '@/config/deck-limits';
import { resolveFollowReleaseId } from '@/lib/deck-access-policy';
import { vocabContentValues, vocabRevisionContentSelection } from '@/db/queries/vocab-content';
import { assertAuthoringCapacity } from '@/lib/authoring-quota';
import { getAuthoringUsage, lockAuthoringAccount } from '@/db/queries/authoring-quota.queries';

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
    if (draftVocabs.length > DECK_LIMITS.maximumReleaseCards)
      throw new DeckDomainError('RELEASE_TOO_LARGE', 'Release exceeds the card limit.');
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

export async function listReleaseHistory(deckId: number) {
  return db
    .select()
    .from(deckReleases)
    .where(eq(deckReleases.deckId, deckId))
    .orderBy(desc(deckReleases.version));
}

export async function hasUnpublishedDraftChanges(deckId: number): Promise<boolean> {
  const rows = await db.execute(sql`
    select case when d.current_release_id is null then true else (
      d.title is distinct from r.title or d.description is distinct from r.description or
      d.copy_policy is distinct from r.copy_policy or
      exists (select 1 from lessons l where l.deck_id=d.id and l.removed_at is null and not exists (
        select 1 from release_lessons rl where rl.release_id=r.id and rl.lesson_id=l.id
          and rl.revision_id=l.current_revision_id and rl.order_index=l.order_index
      )) or exists (select 1 from release_lessons rl where rl.release_id=r.id and not exists (
        select 1 from lessons l where l.id=rl.lesson_id and l.deck_id=d.id and l.removed_at is null
          and l.current_revision_id=rl.revision_id and l.order_index=rl.order_index
      )) or exists (select 1 from vocabs v join lessons l on l.id=v.lesson_id
        where l.deck_id=d.id and l.removed_at is null and v.removed_at is null and not exists (
          select 1 from release_vocabs rv where rv.release_id=r.id and rv.vocab_id=v.id
            and rv.lesson_id=v.lesson_id and rv.revision_id=v.current_revision_id and rv.order_index=v.order_index
      )) or exists (select 1 from release_vocabs rv where rv.release_id=r.id and not exists (
        select 1 from vocabs v join lessons l on l.id=v.lesson_id where v.id=rv.vocab_id
          and l.deck_id=d.id and l.removed_at is null and v.removed_at is null
          and v.lesson_id=rv.lesson_id and v.current_revision_id=rv.revision_id and v.order_index=rv.order_index
      ))
    ) end as changed
    from decks d left join deck_releases r on r.id=d.current_release_id where d.id=${deckId}
  `);
  return Boolean(rows[0]?.changed);
}

export async function getDeckFollowState(deckId: number, userId: string) {
  const [row] = await db
    .select({ follow: deckFollows, currentRelease: deckReleases })
    .from(deckFollows)
    .innerJoin(decks, eq(decks.id, deckFollows.deckId))
    .leftJoin(deckReleases, eq(deckReleases.id, decks.currentReleaseId))
    .where(and(eq(deckFollows.deckId, deckId), eq(deckFollows.userId, userId)))
    .limit(1);
  if (!row) return null;
  const studiedReleaseId = resolveFollowReleaseId(row.follow, row.currentRelease?.id ?? null);
  const [studiedRelease] = studiedReleaseId
    ? await db.select().from(deckReleases).where(eq(deckReleases.id, studiedReleaseId)).limit(1)
    : [undefined];
  return {
    ...row.follow,
    currentRelease: row.currentRelease,
    studiedRelease: studiedRelease ?? null,
    updateAvailable: Boolean(
      row.currentRelease && studiedRelease && row.currentRelease.version > studiedRelease.version,
    ),
  };
}

export async function getReleaseLessonVocabs(releaseId: number, lessonId: number) {
  return db
    .select({
      ...getTableColumns(vocabs),
      ...vocabRevisionContentSelection,
      orderIndex: releaseVocabs.orderIndex,
    })
    .from(releaseVocabs)
    .innerJoin(vocabs, eq(vocabs.id, releaseVocabs.vocabId))
    .innerJoin(vocabRevisions, eq(vocabRevisions.id, releaseVocabs.revisionId))
    .where(and(eq(releaseVocabs.releaseId, releaseId), eq(releaseVocabs.lessonId, lessonId)))
    .orderBy(releaseVocabs.orderIndex, releaseVocabs.vocabId);
}

export async function followDeck(deckId: number, userId: string) {
  return db.transaction(async tx => {
    const [deck] = await tx.select().from(decks).where(eq(decks.id, deckId)).for('update').limit(1);
    if (
      !deck ||
      !deck.currentReleaseId ||
      (deck.visibility === 'private' && deck.ownerId !== userId)
    )
      throw new DeckDomainError('NOT_FOLLOWABLE', 'Deck is not available to follow.');
    assertActive(deck.status, 'follow');
    await tx
      .insert(deckFollows)
      .values({
        userId,
        deckId,
        lastSeenReleaseId: deck.currentReleaseId,
        status: 'active',
        unfollowedAt: null,
      })
      .onConflictDoUpdate({
        target: [deckFollows.userId, deckFollows.deckId],
        set: { status: 'active', unfollowedAt: null, followedAt: new Date() },
      });
    await tx
      .insert(deckAuditEvents)
      .values({ deckId, actorId: userId, eventType: 'deck.followed' });
  });
}

export async function unfollowDeck(deckId: number, userId: string) {
  await db.transaction(async tx => {
    await tx
      .update(deckFollows)
      .set({ status: 'unfollowed', unfollowedAt: new Date() })
      .where(and(eq(deckFollows.deckId, deckId), eq(deckFollows.userId, userId)));
    await tx
      .insert(deckAuditEvents)
      .values({ deckId, actorId: userId, eventType: 'deck.unfollowed' });
  });
}

export async function setFollowRelease(
  deckId: number,
  userId: string,
  releaseId: number,
  mode: 'automatic' | 'manual',
) {
  await db.transaction(async tx => {
    const [release] = await tx
      .select({ id: deckReleases.id })
      .from(deckReleases)
      .where(and(eq(deckReleases.id, releaseId), eq(deckReleases.deckId, deckId)))
      .limit(1);
    if (!release)
      throw new DeckDomainError('INVALID_RELEASE', 'Release does not belong to this deck.');
    const updated = await tx
      .update(deckFollows)
      .set({
        updateMode: mode,
        pinnedReleaseId: mode === 'manual' ? releaseId : null,
        lastSeenReleaseId: releaseId,
      })
      .where(
        and(
          eq(deckFollows.deckId, deckId),
          eq(deckFollows.userId, userId),
          or(eq(deckFollows.status, 'active'), eq(deckFollows.status, 'frozen')),
        ),
      )
      .returning({ id: deckFollows.id });
    if (!updated.length) throw new DeckDomainError('FOLLOW_NOT_FOUND', 'Active follow not found.');
    await tx.insert(deckAuditEvents).values({
      deckId,
      actorId: userId,
      eventType: mode === 'manual' ? 'deck.release_pinned' : 'deck.follow_automatic',
      metadata: { releaseId },
    });
  });
}

export async function updateFollowToLatest(deckId: number, userId: string) {
  await db.transaction(async tx => {
    const [deck] = await tx
      .select({ currentReleaseId: decks.currentReleaseId, status: decks.status })
      .from(decks)
      .where(eq(decks.id, deckId))
      .limit(1);
    if (!deck?.currentReleaseId || deck.status === 'moderation_removed') {
      throw new DeckDomainError('INVALID_RELEASE', 'No accessible current release exists.');
    }
    const updated = await tx
      .update(deckFollows)
      .set({
        updateMode: 'automatic',
        pinnedReleaseId: null,
        lastSeenReleaseId: deck.currentReleaseId,
      })
      .where(
        and(
          eq(deckFollows.deckId, deckId),
          eq(deckFollows.userId, userId),
          or(eq(deckFollows.status, 'active'), eq(deckFollows.status, 'frozen')),
        ),
      )
      .returning({ id: deckFollows.id });
    if (!updated.length) throw new DeckDomainError('FOLLOW_NOT_FOUND', 'Active follow not found.');
    await tx.insert(deckAuditEvents).values({
      deckId,
      actorId: userId,
      eventType: 'deck.follow_updated_latest',
      metadata: { releaseId: deck.currentReleaseId },
    });
  });
}

export async function permanentlyDeleteFollowProgress(deckId: number, userId: string) {
  await db.transaction(async tx => {
    const [relationship] = await tx
      .select({ id: deckFollows.id })
      .from(deckFollows)
      .where(and(eq(deckFollows.deckId, deckId), eq(deckFollows.userId, userId)))
      .for('update')
      .limit(1);
    if (!relationship)
      throw new DeckDomainError('FOLLOW_NOT_FOUND', 'Follow relationship not found.');
    await tx.execute(sql`
      delete from user_vocab_state state
      where state.user_id = ${userId}
      and exists (
        select 1 from release_vocabs rv
        join deck_releases release on release.id = rv.release_id
        where release.deck_id = ${deckId} and rv.vocab_id = state.vocab_id
      )
    `);
    await tx
      .delete(deckFollows)
      .where(and(eq(deckFollows.deckId, deckId), eq(deckFollows.userId, userId)));
    await tx.insert(deckAuditEvents).values({
      deckId,
      actorId: userId,
      eventType: 'deck.follow_progress_deleted',
    });
  });
}

export async function inspectReleaseChanges(releaseId: number, previousReleaseId?: number) {
  const [release] = await db
    .select()
    .from(deckReleases)
    .where(eq(deckReleases.id, releaseId))
    .limit(1);
  if (!release) throw new DeckDomainError('INVALID_RELEASE', 'Release not found.');
  if (previousReleaseId) {
    const [previousRelease] = await db
      .select({ deckId: deckReleases.deckId })
      .from(deckReleases)
      .where(eq(deckReleases.id, previousReleaseId))
      .limit(1);
    if (!previousRelease || previousRelease.deckId !== release.deckId) {
      throw new DeckDomainError('INVALID_RELEASE', 'Compared releases must belong to one deck.');
    }
  }
  const previousId =
    previousReleaseId ??
    (
      await db
        .select({ id: deckReleases.id })
        .from(deckReleases)
        .where(
          and(
            eq(deckReleases.deckId, release.deckId),
            sql`${deckReleases.version} < ${release.version}`,
          ),
        )
        .orderBy(desc(deckReleases.version))
        .limit(1)
    )[0]?.id;
  const currentItems = await db
    .select({ vocabId: releaseVocabs.vocabId, revisionId: releaseVocabs.revisionId })
    .from(releaseVocabs)
    .where(eq(releaseVocabs.releaseId, releaseId));
  const previousItems = previousId
    ? await db
        .select({ vocabId: releaseVocabs.vocabId, revisionId: releaseVocabs.revisionId })
        .from(releaseVocabs)
        .where(eq(releaseVocabs.releaseId, previousId))
    : [];
  const current = new Map(currentItems.map(item => [item.vocabId, item.revisionId]));
  const previous = new Map(previousItems.map(item => [item.vocabId, item.revisionId]));
  return {
    release,
    previousReleaseId: previousId ?? null,
    addedVocabIds: [...current.keys()].filter(id => !previous.has(id)),
    removedVocabIds: [...previous.keys()].filter(id => !current.has(id)),
    changedVocabIds: [...current]
      .filter(([id, revision]) => previous.has(id) && previous.get(id) !== revision)
      .map(([id]) => id),
  };
}

export async function changeDeckStatus(
  deckId: number,
  actorId: string,
  status: 'active' | 'archived' | 'deleted',
) {
  await db.transaction(async tx => {
    const [deck] = await tx
      .select()
      .from(decks)
      .where(and(eq(decks.id, deckId), eq(decks.ownerId, actorId)))
      .for('update')
      .limit(1);
    if (!deck) throw new DeckDomainError('NOT_OWNER', 'Deck not found or access denied.');
    if (deck.status === 'moderation_removed') {
      throw new DeckDomainError(
        'MODERATION_REMOVED',
        'A moderation-removed deck cannot be restored.',
      );
    }
    const allowed = deck.status === 'active' ? ['archived', 'deleted'] : ['active'];
    if (!allowed.includes(status))
      throw new DeckDomainError(
        'INVALID_TRANSITION',
        `Cannot change ${deck.status} deck to ${status}.`,
      );
    const now = new Date();
    await tx
      .update(decks)
      .set({
        status,
        deletedAt: status === 'deleted' ? now : null,
        retentionUntil: status === 'deleted' ? new Date(now.getTime() + 30 * 86400000) : null,
        updatedAt: now,
      })
      .where(eq(decks.id, deckId));
    if (status !== 'active')
      await tx
        .update(deckFollows)
        .set({ status: 'frozen', lastSeenReleaseId: deck.currentReleaseId })
        .where(and(eq(deckFollows.deckId, deckId), eq(deckFollows.status, 'active')));
    if (status === 'active')
      await tx
        .update(deckFollows)
        .set({ status: 'active' })
        .where(and(eq(deckFollows.deckId, deckId), eq(deckFollows.status, 'frozen')));
    await tx.insert(deckAuditEvents).values({
      deckId,
      actorId,
      eventType: status === 'active' ? 'deck.restored' : `deck.${status}`,
      metadata: { previousStatus: deck.status, status },
    });
  });
}

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
          or(
            eq(decks.ownerId, actorId),
            and(ne(decks.visibility, 'private'), ne(decks.status, 'moderation_removed')),
            or(eq(deckFollows.status, 'active'), eq(deckFollows.status, 'frozen')),
          ),
        ),
      )
      .for('update', { of: decks })
      .limit(1);
    if (!source)
      throw new DeckDomainError('RELEASE_INACCESSIBLE', 'Source release is unavailable.');
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
      if (!lessonId)
        throw new DeckDomainError('INVALID_RELEASE', 'Release vocabulary has no lesson.');
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

export async function changeDeckVisibility(
  deckId: number,
  actorId: string,
  visibility: DeckVisibility,
) {
  await db.transaction(async tx => {
    const [deck] = await tx
      .select()
      .from(decks)
      .where(and(eq(decks.id, deckId), eq(decks.ownerId, actorId)))
      .for('update')
      .limit(1);
    if (!deck) throw new DeckDomainError('NOT_OWNER', 'Deck not found or access denied.');
    assertActive(deck.status, 'change visibility of');
    await lockAuthoringAccount(tx, actorId);
    if (visibility === 'public' && deck.visibility !== 'public') {
      assertAuthoringCapacity(await getAuthoringUsage(tx, actorId, deckId), { publicDecks: 1 });
    }
    if (visibility !== 'private' && !deck.currentReleaseId) {
      throw new DeckDomainError('UNPUBLISHED_DECK', 'Publish the deck before sharing it.');
    }
    if (visibility !== 'private' && deck.sourceReleaseId) {
      const [source] = await tx
        .select({ policy: deckReleases.copyPolicy })
        .from(deckReleases)
        .where(eq(deckReleases.id, deck.sourceReleaseId))
        .limit(1);
      if (!source || source.policy !== 'public_forks') {
        throw new DeckDomainError(
          'PUBLIC_FORK_FORBIDDEN',
          'The source release only permits private forks.',
        );
      }
    }

    let catalogStatus: 'eligible' | 'duplicate' | 'hidden' =
      visibility === 'private' ? 'hidden' : 'eligible';
    if (visibility !== 'private' && deck.currentReleaseId) {
      const [release] = await tx
        .select({ hash: deckReleases.contentHash })
        .from(deckReleases)
        .where(eq(deckReleases.id, deck.currentReleaseId))
        .limit(1);
      if (release) {
        const duplicateRows = await tx.execute(sql`
          select true as found from decks other
          join deck_releases published on published.id = other.current_release_id
          where other.id <> ${deckId}
            and coalesce(other.root_deck_id, other.id) = ${deck.rootDeckId ?? deck.id}
            and published.content_hash = ${release.hash}
            and other.visibility in ('public', 'unlisted')
            and other.status = 'active'
          limit 1
        `);
        if (duplicateRows.length > 0) catalogStatus = 'duplicate';
      }
    }
    await tx
      .update(decks)
      .set({ visibility, catalogStatus, updatedAt: new Date() })
      .where(eq(decks.id, deckId));
    await tx.insert(deckAuditEvents).values({
      deckId,
      actorId,
      eventType: 'deck.visibility_changed',
      metadata: { visibility, catalogStatus },
    });
  });
}

export async function changeDeckCopyPolicy(
  deckId: number,
  actorId: string,
  copyPolicy: CopyPolicy,
) {
  await db.transaction(async tx => {
    const [deck] = await tx
      .select()
      .from(decks)
      .where(and(eq(decks.id, deckId), eq(decks.ownerId, actorId)))
      .for('update')
      .limit(1);
    if (!deck) throw new DeckDomainError('NOT_OWNER', 'Deck not found or access denied.');
    assertActive(deck.status, 'change the copy policy of');
    if (deck.sourceReleaseId) {
      const [source] = await tx
        .select({ copyPolicy: deckReleases.copyPolicy })
        .from(deckReleases)
        .where(eq(deckReleases.id, deck.sourceReleaseId))
        .limit(1);
      if (!source) throw new DeckDomainError('INVALID_PROVENANCE', 'Source release is missing.');
      assertPolicyInheritance(source.copyPolicy, copyPolicy);
    }
    await tx.update(decks).set({ copyPolicy, updatedAt: new Date() }).where(eq(decks.id, deckId));
    await tx.insert(deckAuditEvents).values({
      deckId,
      actorId,
      eventType: 'deck.copy_policy_changed',
      metadata: { copyPolicy },
    });
  });
}

export async function reportDeck(
  deckId: number,
  reporterId: string,
  reason: string,
  details?: string,
) {
  await db.transaction(async tx => {
    const [deck] = await tx
      .select({ id: decks.id })
      .from(decks)
      .leftJoin(
        deckFollows,
        and(eq(deckFollows.deckId, decks.id), eq(deckFollows.userId, reporterId)),
      )
      .where(
        and(
          eq(decks.id, deckId),
          ne(decks.status, 'moderation_removed'),
          or(
            eq(decks.ownerId, reporterId),
            and(ne(decks.visibility, 'private'), eq(decks.status, 'active')),
            or(eq(deckFollows.status, 'active'), eq(deckFollows.status, 'frozen')),
          ),
        ),
      )
      .limit(1);
    if (!deck) throw new DeckDomainError('DECK_INACCESSIBLE', 'Deck not found or inaccessible.');
    await tx
      .insert(deckReports)
      .values({ deckId, reporterId, reason, details })
      .onConflictDoUpdate({
        target: [deckReports.reporterId, deckReports.deckId],
        set: { reason, details, createdAt: new Date() },
      });
    await tx.insert(deckAuditEvents).values({
      deckId,
      actorId: reporterId,
      eventType: 'deck.reported',
      metadata: { reason },
    });
  });
}

export async function moderateRemoveDeck(
  deckId: number,
  moderatorId: string,
  moderatorAuthorized: boolean,
) {
  if (!moderatorAuthorized) {
    throw new DeckDomainError('MODERATOR_REQUIRED', 'Moderator access is required.');
  }
  await db.transaction(async tx => {
    const [deck] = await tx
      .select({ id: decks.id })
      .from(decks)
      .where(eq(decks.id, deckId))
      .for('update')
      .limit(1);
    if (!deck) throw new DeckDomainError('DECK_NOT_FOUND', 'Deck not found.');
    await tx
      .update(decks)
      .set({ status: 'moderation_removed', catalogStatus: 'hidden', updatedAt: new Date() })
      .where(eq(decks.id, deckId));
    await tx.update(deckFollows).set({ status: 'frozen' }).where(eq(deckFollows.deckId, deckId));
    await tx.insert(deckAuditEvents).values({
      deckId,
      actorId: moderatorId,
      eventType: 'deck.moderation_removed',
    });
  });
}

export async function setDeckUnderReview(
  deckId: number,
  moderatorId: string,
  moderatorAuthorized: boolean,
) {
  if (!moderatorAuthorized)
    throw new DeckDomainError('MODERATOR_REQUIRED', 'Moderator access is required.');
  await db.transaction(async tx => {
    const updated = await tx
      .update(decks)
      .set({ catalogStatus: 'under_review', updatedAt: new Date() })
      .where(eq(decks.id, deckId))
      .returning({ id: decks.id });
    if (!updated.length) throw new DeckDomainError('DECK_NOT_FOUND', 'Deck not found.');
    await tx.insert(deckAuditEvents).values({
      deckId,
      actorId: moderatorId,
      eventType: 'deck.under_review',
    });
  });
}

export type DeckProvenance = {
  sourceDeckId: number;
  sourceReleaseId: number;
  sourceVersion: number;
  sourceTitle: string;
  sourceCopyPolicy: CopyPolicy;
  rootDeckId: number;
  rootTitle: string;
};

export type RemovedDraftItem = {
  id: number;
  kind: 'lesson' | 'vocab';
  label: string;
};

export async function getRemovedDraftItems(deckId: number): Promise<RemovedDraftItem[]> {
  const rows = await db.execute<RemovedDraftItem>(sql`
    select l.id, 'lesson'::text as kind, lr.title as label
    from lessons l join lesson_revisions lr on lr.id=l.current_revision_id
    where l.deck_id=${deckId} and l.removed_at is not null
    union all
    select v.id, 'vocab'::text as kind, vr.front || ' — ' || vr.back as label
    from vocabs v join vocab_revisions vr on vr.id=v.current_revision_id
    join lessons l on l.id=v.lesson_id
    where l.deck_id=${deckId} and l.removed_at is null and v.removed_at is not null
    order by kind,label
  `);
  return [...rows];
}

export async function getDeckProvenance(deckId: number): Promise<DeckProvenance | null> {
  const rows = await db.execute<DeckProvenance>(sql`
    select source_release.deck_id as "sourceDeckId", source_release.id as "sourceReleaseId",
      source_release.version as "sourceVersion", source_release.title as "sourceTitle",
      source_release.copy_policy as "sourceCopyPolicy",
      root.id as "rootDeckId", coalesce(root_release.title, root.title) as "rootTitle"
    from decks fork
    join deck_releases source_release on source_release.id=fork.source_release_id
    join decks root on root.id=coalesce(fork.root_deck_id,fork.id)
    left join deck_releases root_release on root_release.id=root.current_release_id
    where fork.id=${deckId}
  `);
  return rows[0] ?? null;
}

export async function restrictedHardDeleteDeck(deckId: number, actorId: string): Promise<boolean> {
  return db.transaction(async tx => {
    const [deck] = await tx
      .select()
      .from(decks)
      .where(and(eq(decks.id, deckId), eq(decks.ownerId, actorId)))
      .for('update')
      .limit(1);
    if (
      !deck ||
      deck.status !== 'deleted' ||
      !deck.retentionUntil ||
      deck.retentionUntil > new Date()
    ) {
      throw new DeckDomainError(
        'HARD_DELETE_FORBIDDEN',
        'The deck is not eligible for hard deletion.',
      );
    }
    const dependencies = await tx.execute(sql`
      select (
        (select count(*) from deck_releases where deck_id=${deckId}) +
        (select count(*) from deck_follows where deck_id=${deckId}) +
        (select count(*) from decks where id <> ${deckId} and (source_deck_id=${deckId} or root_deck_id=${deckId})) +
        (select count(*) from deck_audit_events where deck_id=${deckId})
      )::int as value
    `);
    if (Number(dependencies[0].value) > 0) {
      await tx
        .update(decks)
        .set({
          ownerId: '00000000-0000-0000-0000-000000000000',
          title: '[deleted deck]',
          description: null,
          frontLanguage: null,
          backLanguage: null,
          visibility: 'private',
          catalogStatus: 'hidden',
          retentionUntil: null,
          updatedAt: new Date(),
        })
        .where(eq(decks.id, deckId));
      return false;
    }
    await tx.delete(decks).where(eq(decks.id, deckId));
    return true;
  });
}
