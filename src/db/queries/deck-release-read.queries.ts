import { db } from '@/db';
import { deckReleases, releaseVocabs, vocabRevisions, vocabs } from '@/db/schema';
import { vocabRevisionContentSelection } from '@/db/queries/vocab-content';
import { DeckDomainError, type CopyPolicy } from '@/lib/deck-domain';
import { and, desc, eq, getTableColumns, sql } from 'drizzle-orm';
import { decks, deckFollows } from '@/db/schema';
import { accessibleReleaseCondition } from '@/db/queries/deck-access';
import { safeDeckReleaseSelection } from '@/db/queries/deck-release-selection';

export async function listReleaseHistory(deckId: number, userId: string) {
  return db
    .select(safeDeckReleaseSelection)
    .from(deckReleases)
    .innerJoin(decks, eq(decks.id, deckReleases.deckId))
    .leftJoin(deckFollows, and(eq(deckFollows.deckId, decks.id), eq(deckFollows.userId, userId)))
    .where(and(eq(deckReleases.deckId, deckId), accessibleReleaseCondition(userId, true)))
    .orderBy(desc(deckReleases.version));
}

export async function hasUnpublishedDraftChanges(deckId: number): Promise<boolean> {
  const rows = await db.execute(sql`
    select case when d.current_release_id is null then true else (
      d.title is distinct from r.title or d.description is distinct from r.description or
      d.copy_policy is distinct from r.copy_policy or
      d.study_direction is distinct from r.study_direction or
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

export async function getReleaseDeckVocabs(releaseId: number) {
  return db
    .select({
      ...getTableColumns(vocabs),
      ...vocabRevisionContentSelection,
      lessonId: releaseVocabs.lessonId,
      orderIndex: releaseVocabs.orderIndex,
    })
    .from(releaseVocabs)
    .innerJoin(vocabs, eq(vocabs.id, releaseVocabs.vocabId))
    .innerJoin(vocabRevisions, eq(vocabRevisions.id, releaseVocabs.revisionId))
    .where(eq(releaseVocabs.releaseId, releaseId))
    .orderBy(releaseVocabs.lessonId, releaseVocabs.orderIndex, releaseVocabs.vocabId);
}

export async function inspectReleaseChanges(releaseId: number, previousReleaseId?: number) {
  const [release] = await db
    .select({
      ...safeDeckReleaseSelection,
      deckId: deckReleases.deckId,
    })
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
    release: {
      id: release.id,
      version: release.version,
      studyDirection: release.studyDirection,
      copyPolicy: release.copyPolicy,
      changeSummary: release.changeSummary,
      createdAt: release.createdAt,
    },
    previousReleaseId: previousId ?? null,
    addedVocabIds: [...current.keys()].filter(id => !previous.has(id)),
    removedVocabIds: [...previous.keys()].filter(id => !current.has(id)),
    changedVocabIds: [...current]
      .filter(([id, revision]) => previous.has(id) && previous.get(id) !== revision)
      .map(([id]) => id),
  };
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
