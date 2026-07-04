import { db } from '@/db';
import { decks, deckSubscriptions } from '@/db/schema';
import { CreateDeckSubscription } from '@/types/deck-subscription.types';
import { and, eq, isNotNull, isNull, notExists, or } from 'drizzle-orm';

export async function createDeckSubscription(deckSubscription: CreateDeckSubscription) {
  await db.transaction(async tx => {
    // Lock the deck until the insert completes so it cannot be archived or
    // made private after eligibility is checked. Owners may subscribe to any
    // active deck they own; everyone else requires public visibility.
    const [eligibleDeck] = await tx
      .select({ id: decks.id })
      .from(decks)
      .where(
        and(
          eq(decks.id, deckSubscription.deckId),
          isNull(decks.deletedAt),
          or(eq(decks.visibility, 'public'), eq(decks.ownerId, deckSubscription.userId)),
        ),
      )
      .for('update')
      .limit(1);

    if (!eligibleDeck) {
      throw new Error('Deck not found or unavailable for subscription.');
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
