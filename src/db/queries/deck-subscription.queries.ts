import { db } from '@/db';
import { decks, deckSubscriptions, lessons, userVocabState, vocabs } from '@/db/schema';
import { CreateDeckSubscription } from '@/types/deck-subscription.types';
import { and, eq, inArray, isNotNull, isNull, ne, notExists, or } from 'drizzle-orm';

export async function createDeckSubscription(deckSubscription: CreateDeckSubscription) {
  await db.transaction(async tx => {
    // Lock the deck until the insert completes so it cannot be archived or
    // made private after eligibility is checked. Owners already have study
    // access and must not create a redundant follow relationship.
    const [eligibleDeck] = await tx
      .select({ id: decks.id })
      .from(decks)
      .where(
        and(
          eq(decks.id, deckSubscription.deckId),
          isNull(decks.deletedAt),
          eq(decks.visibility, 'public'),
          ne(decks.ownerId, deckSubscription.userId),
        ),
      )
      .for('update', { of: decks })
      .limit(1);

    if (!eligibleDeck) {
      throw new Error('Deck not found or unavailable to follow.');
    }

    await tx
      .insert(deckSubscriptions)
      .values(deckSubscription)
      .onConflictDoNothing({
        target: [deckSubscriptions.userId, deckSubscriptions.deckId],
      });
  });
}

export async function hasDeckSubscription(deckId: number, userId: string): Promise<boolean> {
  const [subscription] = await db
    .select({ id: deckSubscriptions.id })
    .from(deckSubscriptions)
    .where(and(eq(deckSubscriptions.deckId, deckId), eq(deckSubscriptions.userId, userId)))
    .limit(1);

  return Boolean(subscription);
}

export async function canStudyDeck(deckId: number, userId: string): Promise<boolean> {
  const [deck] = await db
    .select({ id: decks.id })
    .from(decks)
    .leftJoin(
      deckSubscriptions,
      and(eq(deckSubscriptions.deckId, decks.id), eq(deckSubscriptions.userId, userId)),
    )
    .where(
      and(
        eq(decks.id, deckId),
        or(
          and(eq(decks.ownerId, userId), isNull(decks.deletedAt)),
          eq(deckSubscriptions.userId, userId),
        ),
      ),
    )
    .limit(1);

  return Boolean(deck);
}

export async function deleteDeckSubscription(deckId: number, userId: string) {
  await db.transaction(async tx => {
    // Archived decks are retained for as long as at least one learner remains.
    // Removing the final subscription makes the archived content disposable.
    await tx
      .delete(deckSubscriptions)
      .where(and(eq(deckSubscriptions.deckId, deckId), eq(deckSubscriptions.userId, userId)));

    await tx
      .delete(decks)
      .where(
        and(
          eq(decks.id, deckId),
          isNotNull(decks.deletedAt),
          notExists(
            tx
              .select({ id: deckSubscriptions.id })
              .from(deckSubscriptions)
              .where(eq(deckSubscriptions.deckId, deckId)),
          ),
        ),
      );
  });
}

export async function createEditableDeckCopy(
  sourceDeckId: number,
  userId: string,
): Promise<number> {
  return db.transaction(async tx => {
    const [sourceDeck] = await tx
      .select({
        id: decks.id,
        title: decks.title,
        description: decks.description,
        frontLanguage: decks.frontLanguage,
        backLanguage: decks.backLanguage,
      })
      .from(decks)
      .leftJoin(
        deckSubscriptions,
        and(eq(deckSubscriptions.deckId, decks.id), eq(deckSubscriptions.userId, userId)),
      )
      .where(
        and(
          eq(decks.id, sourceDeckId),
          or(
            and(isNull(decks.deletedAt), eq(decks.visibility, 'public')),
            eq(deckSubscriptions.userId, userId),
          ),
        ),
      )
      .for('update', { of: decks })
      .limit(1);

    if (!sourceDeck) {
      throw new Error('Deck not found or unavailable to copy.');
    }

    const [copiedDeck] = await tx
      .insert(decks)
      .values({
        ownerId: userId,
        title: sourceDeck.title,
        description: sourceDeck.description,
        frontLanguage: sourceDeck.frontLanguage,
        backLanguage: sourceDeck.backLanguage,
        visibility: 'private',
        sourceDeckId: sourceDeck.id,
        isEditableCopy: true,
      })
      .returning({ id: decks.id });

    const sourceLessons = await tx
      .select()
      .from(lessons)
      .where(eq(lessons.deckId, sourceDeck.id))
      .orderBy(lessons.orderIndex, lessons.id);

    const sourceVocabs = await tx
      .select()
      .from(vocabs)
      .innerJoin(lessons, eq(vocabs.lessonId, lessons.id))
      .where(eq(lessons.deckId, sourceDeck.id))
      .orderBy(lessons.orderIndex, vocabs.orderIndex, vocabs.id);

    const sourceVocabIds = sourceVocabs.map(row => row.vocabs.id);
    const sourceProgress =
      sourceVocabIds.length > 0
        ? await tx
            .select()
            .from(userVocabState)
            .where(
              and(
                eq(userVocabState.userId, userId),
                inArray(userVocabState.vocabId, sourceVocabIds),
              ),
            )
        : [];
    const progressByVocabId = new Map(sourceProgress.map(state => [state.vocabId, state]));

    for (const sourceLesson of sourceLessons) {
      const [copiedLesson] = await tx
        .insert(lessons)
        .values({
          deckId: copiedDeck.id,
          title: sourceLesson.title,
          orderIndex: sourceLesson.orderIndex,
        })
        .returning({ id: lessons.id });

      const lessonVocabs = sourceVocabs.filter(row => row.vocabs.lessonId === sourceLesson.id);

      if (lessonVocabs.length > 0) {
        const copiedVocabs = await tx
          .insert(vocabs)
          .values(
            lessonVocabs.map(({ vocabs: sourceVocab }) => ({
              sourceVocabId: sourceVocab.id,
              lessonId: copiedLesson.id,
              front: sourceVocab.front,
              back: sourceVocab.back,
              frontAlternatives: sourceVocab.frontAlternatives,
              backAlternatives: sourceVocab.backAlternatives,
              reading: sourceVocab.reading,
              tags: sourceVocab.tags,
              metadata: sourceVocab.metadata,
              notes: sourceVocab.notes,
              orderIndex: sourceVocab.orderIndex,
            })),
          )
          .returning({ id: vocabs.id, sourceVocabId: vocabs.sourceVocabId });

        const copiedVocabIdBySourceId = new Map(
          copiedVocabs.map(copiedVocab => [copiedVocab.sourceVocabId, copiedVocab.id]),
        );
        const copiedProgress = lessonVocabs.flatMap(({ vocabs: sourceVocab }) => {
          const progress = progressByVocabId.get(sourceVocab.id);
          const copiedVocabId = copiedVocabIdBySourceId.get(sourceVocab.id);
          if (!copiedVocabId) {
            throw new Error('A copied word could not be matched to its source.');
          }

          return progress
            ? [
                {
                  userId,
                  vocabId: copiedVocabId,
                  srsLevel: progress.srsLevel,
                  dueAt: progress.dueAt,
                  createdAt: progress.createdAt,
                  updatedAt: progress.updatedAt,
                },
              ]
            : [];
        });

        if (copiedProgress.length > 0) {
          await tx.insert(userVocabState).values(copiedProgress);
        }
      }
    }

    await tx
      .delete(deckSubscriptions)
      .where(
        and(eq(deckSubscriptions.deckId, sourceDeck.id), eq(deckSubscriptions.userId, userId)),
      );

    await tx
      .delete(decks)
      .where(
        and(
          eq(decks.id, sourceDeck.id),
          isNotNull(decks.deletedAt),
          notExists(
            tx
              .select({ id: deckSubscriptions.id })
              .from(deckSubscriptions)
              .where(eq(deckSubscriptions.deckId, sourceDeck.id)),
          ),
        ),
      );

    return copiedDeck.id;
  });
}
