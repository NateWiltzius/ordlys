import { db } from '@/db';
import { decks, deckSubscriptions } from '@/db/schema';
import { CreateDeckSubscription } from '@/types/deck-subscription.types';
import { and, eq, isNotNull, notExists } from 'drizzle-orm';

export async function createDeckSubscription(deckSubscription: CreateDeckSubscription) {
  await db
    .insert(deckSubscriptions)
    .values(deckSubscription)
    .onConflictDoNothing({
      target: [deckSubscriptions.userId, deckSubscriptions.deckId],
    });
}

export async function deleteDeckSubscription(deckId: number, userId: string) {
  await db.transaction(async tx => {
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
