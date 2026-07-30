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
import { eq } from 'drizzle-orm';
import { vocabContentValues, vocabRevisionValues } from '@/db/queries/vocab-content';
import { assertAuthoringCapacity } from '@/lib/authoring-quota';
import { getAuthoringUsage, lockAuthoringAccount } from '@/db/queries/authoring-quota.queries';

type ImportDeckInput = Pick<
  CreateDeck,
  | 'ownerId'
  | 'title'
  | 'description'
  | 'frontLanguage'
  | 'backLanguage'
  | 'studyDirection'
  | 'visibility'
>;

export async function importDeck(input: ImportDeckInput, rows: ImportedVocab[]): Promise<number> {
  return db.transaction(async tx => {
    await lockAuthoringAccount(tx, input.ownerId);
    const lessonCount = new Set(rows.map(row => row.lesson)).size;
    assertAuthoringCapacity(
      await getAuthoringUsage(tx, input.ownerId),
      {
        activeDecks: 1,
        deckCards: rows.length,
        logicalVocabs: rows.length,
        revisionsToday: rows.length + lessonCount,
      },
      {
        deckCards: { message: 'Import exceeds the deck card limit.' },
        revisionsToday: { message: 'Import exceeds the daily revision limit.' },
      },
    );
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
        ...vocabContentValues(row),
        orderIndex,
      };
    });

    for (let start = 0; start < values.length; start += 1000) {
      const batch = values.slice(start, start + 1000);
      const inserted = await tx.insert(vocabs).values(batch).returning({ id: vocabs.id });
      const revisions = await tx
        .insert(vocabRevisions)
        .values(
          inserted.map((created, index) =>
            vocabRevisionValues(created.id, batch[index], input.ownerId),
          ),
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
