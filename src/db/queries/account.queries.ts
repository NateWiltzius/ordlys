import { db } from '@/db';
import { decks, deckSubscriptions, userVocabState } from '@/db/schema';
import { and, eq, inArray, isNotNull, notExists } from 'drizzle-orm';

export async function deleteAccountData(
  userId: string,
  deleteAuthenticationUser: () => Promise<void>,
) {
  await db.transaction(async tx => {
    const deletedAt = new Date();

    const ownedDecks = await tx
      .update(decks)
      .set({ deletedAt, updatedAt: deletedAt })
      .where(eq(decks.ownerId, userId))
      .returning({ id: decks.id });

    await tx.delete(userVocabState).where(eq(userVocabState.userId, userId));
    const removedSubscriptions = await tx
      .delete(deckSubscriptions)
      .where(eq(deckSubscriptions.userId, userId))
      .returning({ deckId: deckSubscriptions.deckId });
    const affectedDeckIds = [
      ...new Set([
        ...ownedDecks.map(deck => deck.id),
        ...removedSubscriptions.map(subscription => subscription.deckId),
      ]),
    ];

    if (affectedDeckIds.length > 0) {
      await tx
        .delete(decks)
        .where(
          and(
            inArray(decks.id, affectedDeckIds),
            isNotNull(decks.deletedAt),
            notExists(
              tx
                .select({ id: deckSubscriptions.id })
                .from(deckSubscriptions)
                .where(eq(deckSubscriptions.deckId, decks.id)),
            ),
          ),
        );
    }

    await deleteAuthenticationUser();
  });
}
