import { db } from '@/db';
import { decks, lessons, userVocabState, vocabRevisions, vocabs } from '@/db/schema';
import { CreateVocab, UpdateVocabInput, Vocab } from '@/types/vocab.types';
import { and, eq, getTableColumns, isNull, sql } from 'drizzle-orm';
import { OrderDirection } from '@/types/order.types';
import { DeckDomainError } from '@/lib/deck-domain';
import { DECK_LIMITS } from '@/config/deck-limits';

export const getVocabByLessonId = async (lessonId: number): Promise<Vocab[]> => {
  return db
    .select({
      ...getTableColumns(vocabs),
      front: vocabRevisions.front,
      back: vocabRevisions.back,
      frontAlternatives: vocabRevisions.frontAlternatives,
      backAlternatives: vocabRevisions.backAlternatives,
      frontToBackQuizHint: vocabRevisions.frontToBackQuizHint,
      backToFrontQuizHint: vocabRevisions.backToFrontQuizHint,
      reading: vocabRevisions.reading,
      tags: vocabRevisions.tags,
      metadata: vocabRevisions.metadata,
      notes: vocabRevisions.notes,
    })
    .from(vocabs)
    .innerJoin(vocabRevisions, eq(vocabRevisions.id, vocabs.currentRevisionId))
    .where(and(eq(vocabs.lessonId, lessonId), isNull(vocabs.removedAt)))
    .orderBy(vocabs.orderIndex, vocabs.id);
};

export const getUserVocabLevelsByLessonId = async (lessonId: number, userId: string) => {
  return db
    .select({
      vocabId: userVocabState.vocabId,
      srsLevel: userVocabState.srsLevel,
    })
    .from(userVocabState)
    .innerJoin(vocabs, eq(userVocabState.vocabId, vocabs.id))
    .where(and(eq(vocabs.lessonId, lessonId), eq(userVocabState.userId, userId)));
};

export const createVocab = async (vocab: CreateVocab, userId: string): Promise<number> => {
  return db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`);
    const [lesson] = await tx
      .select({ deckId: lessons.deckId })
      .from(lessons)
      .innerJoin(decks, eq(lessons.deckId, decks.id))
      .where(
        and(eq(lessons.id, vocab.lessonId), eq(decks.ownerId, userId), eq(decks.status, 'active')),
      )
      .for('update')
      .limit(1);

    if (!lesson) throw new Error('Lesson not found or access denied.');
    const quotaRows = await tx.execute(sql`
      select
        (select count(*) from vocabs v join lessons l on l.id=v.lesson_id where l.deck_id=${lesson.deckId} and v.removed_at is null)::int as deck_count,
        (select count(*) from vocabs v join lessons l on l.id=v.lesson_id join decks d on d.id=l.deck_id where d.owner_id=${userId})::int as account_count,
        ((select count(*) from vocab_revisions where creator_id=${userId} and created_at >= now() - interval '1 day') +
         (select count(*) from lesson_revisions where creator_id=${userId} and created_at >= now() - interval '1 day'))::int as revision_count
    `);
    const quota = quotaRows[0];
    if (Number(quota.deck_count) >= DECK_LIMITS.cardsPerDeck) {
      throw new DeckDomainError('CARD_QUOTA', 'This deck has reached its card limit.');
    }
    if (Number(quota.account_count) >= DECK_LIMITS.logicalVocabsPerAccount) {
      throw new DeckDomainError('VOCAB_QUOTA', 'Account vocabulary limit reached.');
    }
    if (Number(quota.revision_count) >= DECK_LIMITS.revisionsPerDay) {
      throw new DeckDomainError('REVISION_RATE_LIMIT', 'Daily revision limit reached.');
    }

    const [order] = await tx
      .select({
        nextIndex: sql<number>`coalesce(max(${vocabs.orderIndex}), -1) + 1`,
      })
      .from(vocabs)
      .where(eq(vocabs.lessonId, vocab.lessonId));

    const [created] = await tx
      .insert(vocabs)
      .values({
        lessonId: vocab.lessonId,
        front: vocab.front,
        back: vocab.back,
        frontAlternatives: vocab.frontAlternatives,
        backAlternatives: vocab.backAlternatives,
        frontToBackQuizHint: vocab.frontToBackQuizHint,
        backToFrontQuizHint: vocab.backToFrontQuizHint,
        reading: vocab.reading,
        tags: vocab.tags,
        metadata: vocab.metadata,
        notes: vocab.notes,
        orderIndex: Number(order.nextIndex),
      })
      .returning({ id: vocabs.id });
    const [revision] = await tx
      .insert(vocabRevisions)
      .values({
        vocabId: created.id,
        front: vocab.front,
        back: vocab.back,
        frontAlternatives: vocab.frontAlternatives ?? [],
        backAlternatives: vocab.backAlternatives ?? [],
        frontToBackQuizHint: vocab.frontToBackQuizHint,
        backToFrontQuizHint: vocab.backToFrontQuizHint,
        reading: vocab.reading,
        tags: vocab.tags ?? [],
        metadata: vocab.metadata ?? {},
        notes: vocab.notes,
        creatorId: userId,
      })
      .returning({ id: vocabRevisions.id });
    await tx
      .update(vocabs)
      .set({ currentRevisionId: revision.id, rootVocabId: created.id })
      .where(eq(vocabs.id, created.id));
    return lesson.deckId;
  });
};

export const moveVocab = async (
  vocabId: number,
  userId: string,
  direction: OrderDirection,
): Promise<number> => {
  return db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`);
    const [targetVocab] = await tx
      .select({ lessonId: vocabs.lessonId, deckId: lessons.deckId })
      .from(vocabs)
      .innerJoin(lessons, eq(vocabs.lessonId, lessons.id))
      .innerJoin(decks, eq(lessons.deckId, decks.id))
      .where(and(eq(vocabs.id, vocabId), eq(decks.ownerId, userId), eq(decks.status, 'active')))
      .for('update')
      .limit(1);

    if (!targetVocab) {
      throw new Error('Vocabulary not found or access denied');
    }

    const orderedVocabs = await tx
      .select({ id: vocabs.id, orderIndex: vocabs.orderIndex })
      .from(vocabs)
      .where(eq(vocabs.lessonId, targetVocab.lessonId))
      .orderBy(vocabs.orderIndex, vocabs.id);

    const currentIndex = orderedVocabs.findIndex(vocab => vocab.id === vocabId);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= orderedVocabs.length) {
      return targetVocab.deckId;
    }

    const currentVocab = orderedVocabs[currentIndex];
    const adjacentVocab = orderedVocabs[targetIndex];
    await tx
      .update(vocabs)
      .set({ orderIndex: adjacentVocab.orderIndex })
      .where(eq(vocabs.id, currentVocab.id));
    await tx
      .update(vocabs)
      .set({ orderIndex: currentVocab.orderIndex })
      .where(eq(vocabs.id, adjacentVocab.id));

    return targetVocab.deckId;
  });
};

export const updateVocab = async (
  vocabId: number,
  vocab: UpdateVocabInput,
  userId: string,
): Promise<number> => {
  return db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`);
    const [target] = await tx
      .select({ deckId: lessons.deckId })
      .from(vocabs)
      .innerJoin(lessons, eq(vocabs.lessonId, lessons.id))
      .innerJoin(decks, eq(lessons.deckId, decks.id))
      .where(and(eq(vocabs.id, vocabId), eq(decks.ownerId, userId), eq(decks.status, 'active')))
      .for('update')
      .limit(1);
    if (!target) throw new Error('Vocabulary not found or access denied.');
    const revisionRows = await tx.execute(sql`
      select ((select count(*) from vocab_revisions where creator_id=${userId} and created_at >= now() - interval '1 day') +
      (select count(*) from lesson_revisions where creator_id=${userId} and created_at >= now() - interval '1 day'))::int as value
    `);
    if (Number(revisionRows[0].value) >= DECK_LIMITS.revisionsPerDay) {
      throw new DeckDomainError('REVISION_RATE_LIMIT', 'Daily revision limit reached.');
    }

    const [current] = await tx.select().from(vocabs).where(eq(vocabs.id, vocabId)).limit(1);
    const [revision] = await tx
      .insert(vocabRevisions)
      .values({
        vocabId,
        front: vocab.front,
        back: vocab.back,
        frontAlternatives: vocab.frontAlternatives ?? [],
        backAlternatives: vocab.backAlternatives ?? [],
        frontToBackQuizHint: vocab.frontToBackQuizHint,
        backToFrontQuizHint: vocab.backToFrontQuizHint,
        reading: vocab.reading,
        tags: vocab.tags ?? current.tags,
        metadata: vocab.metadata ?? current.metadata,
        notes: vocab.notes === undefined ? current.notes : vocab.notes,
        creatorId: userId,
      })
      .returning({ id: vocabRevisions.id });
    await tx
      .update(vocabs)
      .set({
        front: vocab.front,
        back: vocab.back,
        frontAlternatives: vocab.frontAlternatives,
        backAlternatives: vocab.backAlternatives,
        frontToBackQuizHint: vocab.frontToBackQuizHint,
        backToFrontQuizHint: vocab.backToFrontQuizHint,
        reading: vocab.reading,
        ...(vocab.tags === undefined ? {} : { tags: vocab.tags }),
        ...(vocab.metadata === undefined ? {} : { metadata: vocab.metadata }),
        ...(vocab.notes === undefined ? {} : { notes: vocab.notes }),
        updatedAt: new Date(),
        currentRevisionId: revision.id,
      })
      .where(eq(vocabs.id, vocabId));
    return target.deckId;
  });
};

export const deleteVocab = async (vocabId: number, userId: string): Promise<number> => {
  return db.transaction(async tx => {
    const [target] = await tx
      .select({ deckId: lessons.deckId })
      .from(vocabs)
      .innerJoin(lessons, eq(vocabs.lessonId, lessons.id))
      .innerJoin(decks, eq(lessons.deckId, decks.id))
      .where(and(eq(vocabs.id, vocabId), eq(decks.ownerId, userId), eq(decks.status, 'active')))
      .for('update')
      .limit(1);
    if (!target) throw new Error('Vocabulary not found or access denied.');

    await tx
      .update(vocabs)
      .set({ removedAt: new Date(), updatedAt: new Date() })
      .where(eq(vocabs.id, vocabId));
    return target.deckId;
  });
};

export const restoreVocab = async (vocabId: number, userId: string): Promise<number> => {
  return db.transaction(async tx => {
    const [target] = await tx
      .select({ deckId: lessons.deckId })
      .from(vocabs)
      .innerJoin(lessons, eq(lessons.id, vocabs.lessonId))
      .innerJoin(decks, eq(decks.id, lessons.deckId))
      .where(
        and(
          eq(vocabs.id, vocabId),
          eq(decks.ownerId, userId),
          eq(decks.status, 'active'),
          isNull(lessons.removedAt),
          sql`${vocabs.removedAt} is not null`,
        ),
      )
      .for('update', { of: vocabs })
      .limit(1);
    if (!target) throw new DeckDomainError('VOCAB_NOT_FOUND', 'Removed vocabulary not found.');
    await tx
      .update(vocabs)
      .set({ removedAt: null, updatedAt: new Date() })
      .where(eq(vocabs.id, vocabId));
    return target.deckId;
  });
};

/** Meaning-changing replacement: creates a fresh logical identity and retires the old draft item. */
export const replaceVocab = async (
  vocabId: number,
  replacement: UpdateVocabInput,
  userId: string,
): Promise<{ deckId: number; vocabId: number }> => {
  return db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`);
    const [current] = await tx
      .select({ vocab: vocabs, deckId: lessons.deckId })
      .from(vocabs)
      .innerJoin(lessons, eq(vocabs.lessonId, lessons.id))
      .innerJoin(decks, eq(lessons.deckId, decks.id))
      .where(
        and(
          eq(vocabs.id, vocabId),
          eq(decks.ownerId, userId),
          eq(decks.status, 'active'),
          isNull(vocabs.removedAt),
        ),
      )
      .for('update', { of: vocabs })
      .limit(1);
    if (!current) throw new Error('Vocabulary not found or access denied.');
    const quotaRows = await tx.execute(sql`
      select
        (select count(*) from vocabs v join lessons l on l.id=v.lesson_id join decks d on d.id=l.deck_id where d.owner_id=${userId})::int as account_count,
        ((select count(*) from vocab_revisions where creator_id=${userId} and created_at >= now() - interval '1 day') +
         (select count(*) from lesson_revisions where creator_id=${userId} and created_at >= now() - interval '1 day'))::int as revision_count
    `);
    if (Number(quotaRows[0].account_count) >= DECK_LIMITS.logicalVocabsPerAccount) {
      throw new DeckDomainError('VOCAB_QUOTA', 'Account vocabulary limit reached.');
    }
    if (Number(quotaRows[0].revision_count) >= DECK_LIMITS.revisionsPerDay) {
      throw new DeckDomainError('REVISION_RATE_LIMIT', 'Daily revision limit reached.');
    }

    const [created] = await tx
      .insert(vocabs)
      .values({
        lessonId: current.vocab.lessonId,
        front: replacement.front,
        back: replacement.back,
        frontAlternatives: replacement.frontAlternatives ?? [],
        backAlternatives: replacement.backAlternatives ?? [],
        frontToBackQuizHint: replacement.frontToBackQuizHint,
        backToFrontQuizHint: replacement.backToFrontQuizHint,
        reading: replacement.reading,
        tags: replacement.tags ?? [],
        metadata: replacement.metadata ?? {},
        notes: replacement.notes,
        orderIndex: current.vocab.orderIndex,
      })
      .returning({ id: vocabs.id });
    const [revision] = await tx
      .insert(vocabRevisions)
      .values({
        vocabId: created.id,
        front: replacement.front,
        back: replacement.back,
        frontAlternatives: replacement.frontAlternatives ?? [],
        backAlternatives: replacement.backAlternatives ?? [],
        frontToBackQuizHint: replacement.frontToBackQuizHint,
        backToFrontQuizHint: replacement.backToFrontQuizHint,
        reading: replacement.reading,
        tags: replacement.tags ?? [],
        metadata: replacement.metadata ?? {},
        notes: replacement.notes,
        creatorId: userId,
      })
      .returning({ id: vocabRevisions.id });
    await tx
      .update(vocabs)
      .set({ currentRevisionId: revision.id, rootVocabId: created.id })
      .where(eq(vocabs.id, created.id));
    await tx
      .update(vocabs)
      .set({ removedAt: new Date(), updatedAt: new Date() })
      .where(eq(vocabs.id, vocabId));
    return { deckId: current.deckId, vocabId: created.id };
  });
};
