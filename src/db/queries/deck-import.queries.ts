import { db } from '@/db';
import { decks, lessons, vocabs } from '@/db/schema';
import { ImportedVocab } from '@/lib/deck-import/csv';
import { CreateDeck } from '@/types/deck.types';

type ImportDeckInput = Pick<
  CreateDeck,
  'ownerId' | 'title' | 'description' | 'frontLanguage' | 'backLanguage' | 'visibility'
>;

export async function importDeck(input: ImportDeckInput, rows: ImportedVocab[]): Promise<number> {
  return db.transaction(async tx => {
    const [deck] = await tx.insert(decks).values(input).returning({ id: decks.id });
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
        orderIndex,
      };
    });

    for (let start = 0; start < values.length; start += 1000) {
      await tx.insert(vocabs).values(values.slice(start, start + 1000));
    }

    return deck.id;
  });
}
