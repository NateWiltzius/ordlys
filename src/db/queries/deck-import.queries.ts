import { db } from '@/db';
import {
  deckAuditEvents,
  decks,
  lessonRevisions,
  lessons,
  vocabRevisions,
  vocabs,
} from '@/db/schema';
import { ImportedVocab } from '@/lib/deck-import/csv';
import { CreateDeck } from '@/types/deck.types';
import { and, count, eq, sql } from 'drizzle-orm';
import { DECK_LIMITS } from '@/config/deck-limits';
import { DeckDomainError } from '@/lib/deck-domain';

type ImportDeckInput = Pick<
  CreateDeck,
  'ownerId' | 'title' | 'description' | 'frontLanguage' | 'backLanguage' | 'visibility'
>;

export async function importDeck(input: ImportDeckInput, rows: ImportedVocab[]): Promise<number> {
  return db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${input.ownerId}))`);
    const [[owned], [accountVocabs], revisionRows] = await Promise.all([
      tx
        .select({ value: count(decks.id) })
        .from(decks)
        .where(and(eq(decks.ownerId, input.ownerId), eq(decks.status, 'active'))),
      tx
        .select({ value: count(vocabs.id) })
        .from(vocabs)
        .innerJoin(lessons, eq(lessons.id, vocabs.lessonId))
        .innerJoin(decks, eq(decks.id, lessons.deckId))
        .where(eq(decks.ownerId, input.ownerId)),
      tx.execute(sql`
        select ((select count(*) from vocab_revisions where creator_id=${input.ownerId} and created_at >= now() - interval '1 day') +
        (select count(*) from lesson_revisions where creator_id=${input.ownerId} and created_at >= now() - interval '1 day'))::int as value
      `),
    ]);
    const lessonCount = new Set(rows.map(row => row.lesson)).size;
    if (Number(owned.value) >= DECK_LIMITS.activeOwnedDecks)
      throw new DeckDomainError('DECK_QUOTA', 'Active deck limit reached.');
    if (rows.length > DECK_LIMITS.cardsPerDeck)
      throw new DeckDomainError('CARD_QUOTA', 'Import exceeds the deck card limit.');
    if (Number(accountVocabs.value) + rows.length > DECK_LIMITS.logicalVocabsPerAccount)
      throw new DeckDomainError('VOCAB_QUOTA', 'Account vocabulary limit reached.');
    if (Number(revisionRows[0].value) + rows.length + lessonCount > DECK_LIMITS.revisionsPerDay)
      throw new DeckDomainError('REVISION_RATE_LIMIT', 'Import exceeds the daily revision limit.');
    const [deck] = await tx
      .insert(decks)
      .values({ ...input, visibility: 'private' })
      .returning({ id: decks.id });
    await tx.update(decks).set({ rootDeckId: deck.id }).where(eq(decks.id, deck.id));
    await tx.insert(deckAuditEvents).values({
      deckId: deck.id,
      actorId: input.ownerId,
      eventType: 'deck.imported',
      metadata: { cards: rows.length, lessons: lessonCount },
    });
    const lessonTitles = [...new Set(rows.map(row => row.lesson))];
    const createdLessons = await tx
      .insert(lessons)
      .values(
        lessonTitles.map((title, orderIndex) => ({
          deckId: deck.id,
          title,
          orderIndex,
        })),
      )
      .returning({ id: lessons.id, title: lessons.title });
    const createdLessonRevisions = await tx
      .insert(lessonRevisions)
      .values(
        createdLessons.map(lesson => ({
          lessonId: lesson.id,
          title: lesson.title,
          creatorId: input.ownerId,
        })),
      )
      .returning({ id: lessonRevisions.id, lessonId: lessonRevisions.lessonId });
    for (const revision of createdLessonRevisions) {
      await tx
        .update(lessons)
        .set({ currentRevisionId: revision.id })
        .where(eq(lessons.id, revision.lessonId));
    }
    const lessonIds = new Map(createdLessons.map(lesson => [lesson.title, lesson.id]));
    const orderByLesson = new Map<string, number>();

    const values = rows.map(row => {
      const orderIndex = orderByLesson.get(row.lesson) ?? 0;
      orderByLesson.set(row.lesson, orderIndex + 1);
      const lessonId = lessonIds.get(row.lesson);
      if (!lessonId) throw new Error(`Could not create the lesson “${row.lesson}”.`);
      return {
        lessonId,
        front: row.front,
        back: row.back,
        reading: row.reading,
        frontAlternatives: row.frontAlternatives,
        backAlternatives: row.backAlternatives,
        tags: row.tags,
        metadata: row.metadata,
        notes: row.notes,
        orderIndex,
      };
    });

    for (let start = 0; start < values.length; start += 1000) {
      const batch = values.slice(start, start + 1000);
      const inserted = await tx.insert(vocabs).values(batch).returning({ id: vocabs.id });
      const revisions = await tx
        .insert(vocabRevisions)
        .values(
          inserted.map((created, index) => ({
            vocabId: created.id,
            front: batch[index].front,
            back: batch[index].back,
            frontAlternatives: batch[index].frontAlternatives,
            backAlternatives: batch[index].backAlternatives,
            reading: batch[index].reading,
            tags: batch[index].tags,
            metadata: batch[index].metadata,
            notes: batch[index].notes,
            creatorId: input.ownerId,
          })),
        )
        .returning({ id: vocabRevisions.id, vocabId: vocabRevisions.vocabId });
      for (const revision of revisions) {
        await tx
          .update(vocabs)
          .set({ currentRevisionId: revision.id, rootVocabId: revision.vocabId })
          .where(eq(vocabs.id, revision.vocabId));
      }
    }

    return deck.id;
  });
}
