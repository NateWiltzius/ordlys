import { deckSubscriptions, decks } from '@/db/schema';
import { and, eq, isNull, or } from 'drizzle-orm';

export function studyDeckAccess(userId: string) {
  return eq(deckSubscriptions.userId, userId);
}

export function viewDeckAccess(userId: string) {
  return or(
    and(isNull(decks.deletedAt), or(eq(decks.visibility, 'public'), eq(decks.ownerId, userId))),
    eq(deckSubscriptions.userId, userId),
  );
}
