import { db } from '@/db';
import {
  deckAuditEvents,
  deckFollows,
  deckReports,
  deckReleases,
  decks,
  feedback,
  lessonRevisions,
  lessons,
  reviewAttempts,
  userVocabState,
  vocabRevisions,
  vocabs,
} from '@/db/schema';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { vocabRevisionContentSelection } from '@/db/queries/vocab-content';

const ANONYMOUS_OWNER_ID = '00000000-0000-0000-0000-000000000000';

export async function getAccountExportData(userId: string) {
  const ownedDecks = await db
    .select()
    .from(decks)
    .where(eq(decks.ownerId, userId))
    .orderBy(decks.id);
  const ownedDeckIds = ownedDecks.map(deck => deck.id);

  const [
    authoredContent,
    follows,
    learningHistory,
    submittedFeedback,
    submittedReports,
    auditEvents,
    reviewHistory,
  ] = await Promise.all([
    ownedDeckIds.length
      ? db
          .select({
            deckId: decks.id,
            lessonId: lessons.id,
            lesson: lessonRevisions.title,
            lessonOrder: lessons.orderIndex,
            lessonRemovedAt: lessons.removedAt,
            vocabId: vocabs.id,
            ...vocabRevisionContentSelection,
            vocabOrder: vocabs.orderIndex,
            vocabRemovedAt: vocabs.removedAt,
          })
          .from(decks)
          .innerJoin(lessons, eq(lessons.deckId, decks.id))
          .innerJoin(lessonRevisions, eq(lessonRevisions.id, lessons.currentRevisionId))
          .innerJoin(vocabs, eq(vocabs.lessonId, lessons.id))
          .innerJoin(vocabRevisions, eq(vocabRevisions.id, vocabs.currentRevisionId))
          .where(inArray(decks.id, ownedDeckIds))
          .orderBy(asc(decks.id), asc(lessons.orderIndex), asc(vocabs.orderIndex))
      : Promise.resolve([]),
    db.select().from(deckFollows).where(eq(deckFollows.userId, userId)).orderBy(deckFollows.id),
    db
      .select({
        deckId: decks.id,
        deckTitle: decks.title,
        lessonId: lessons.id,
        vocabId: vocabs.id,
        front: vocabRevisions.front,
        back: vocabRevisions.back,
        srsLevel: userVocabState.srsLevel,
        dueAt: userVocabState.dueAt,
        createdAt: userVocabState.createdAt,
        updatedAt: userVocabState.updatedAt,
      })
      .from(userVocabState)
      .innerJoin(vocabs, eq(vocabs.id, userVocabState.vocabId))
      .innerJoin(vocabRevisions, eq(vocabRevisions.id, vocabs.currentRevisionId))
      .innerJoin(lessons, eq(lessons.id, vocabs.lessonId))
      .innerJoin(decks, eq(decks.id, lessons.deckId))
      .where(eq(userVocabState.userId, userId))
      .orderBy(asc(userVocabState.id)),
    db.select().from(feedback).where(eq(feedback.userId, userId)).orderBy(feedback.id),
    db.select().from(deckReports).where(eq(deckReports.reporterId, userId)).orderBy(deckReports.id),
    db
      .select()
      .from(deckAuditEvents)
      .where(and(eq(deckAuditEvents.actorId, userId)))
      .orderBy(deckAuditEvents.id),
    db
      .select()
      .from(reviewAttempts)
      .where(eq(reviewAttempts.userId, userId))
      .orderBy(reviewAttempts.id),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    decks: ownedDecks,
    authoredContent,
    follows,
    learningHistory,
    feedback: submittedFeedback,
    deckReports: submittedReports,
    auditEvents,
    reviewHistory,
  };
}

export async function deleteAccountData(userId: string) {
  await db.transaction(async tx => {
    const deletedAt = new Date();

    // Preserve releases, descendants, and provenance while removing the account identifier.
    await tx
      .update(decks)
      .set({
        ownerId: ANONYMOUS_OWNER_ID,
        status: 'deleted',
        catalogStatus: 'hidden',
        deletedAt,
        retentionUntil: null,
        updatedAt: deletedAt,
      })
      .where(eq(decks.ownerId, userId));
    await tx
      .update(deckAuditEvents)
      .set({ actorId: null })
      .where(eq(deckAuditEvents.actorId, userId));
    await tx
      .update(deckReleases)
      .set({ creatorId: ANONYMOUS_OWNER_ID })
      .where(eq(deckReleases.creatorId, userId));
    await tx
      .update(lessonRevisions)
      .set({ creatorId: ANONYMOUS_OWNER_ID })
      .where(eq(lessonRevisions.creatorId, userId));
    await tx
      .update(vocabRevisions)
      .set({ creatorId: ANONYMOUS_OWNER_ID })
      .where(eq(vocabRevisions.creatorId, userId));
    await tx.delete(feedback).where(eq(feedback.userId, userId));
    await tx.delete(deckReports).where(eq(deckReports.reporterId, userId));
    await tx.delete(reviewAttempts).where(eq(reviewAttempts.userId, userId));
    await tx.delete(userVocabState).where(eq(userVocabState.userId, userId));
    await tx.delete(deckFollows).where(eq(deckFollows.userId, userId));
  });
}
