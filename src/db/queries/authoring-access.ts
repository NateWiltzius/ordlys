import { decks, lessons, vocabs } from '../schema';
import { and, eq, isNull } from 'drizzle-orm';

export function activeOwnedDeckCondition(userId: string) {
  return and(eq(decks.ownerId, userId), eq(decks.status, 'active'));
}

export function activeEditableLessonCondition(lessonId: number, userId: string) {
  return and(eq(lessons.id, lessonId), isNull(lessons.removedAt), activeOwnedDeckCondition(userId));
}

export function activeEditableVocabCondition(vocabId: number, userId: string) {
  return and(
    eq(vocabs.id, vocabId),
    isNull(vocabs.removedAt),
    isNull(lessons.removedAt),
    activeOwnedDeckCondition(userId),
  );
}
