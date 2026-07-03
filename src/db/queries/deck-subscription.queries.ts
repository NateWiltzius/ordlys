import { db } from '@/db';
import { deckSubscriptions } from '@/db/schema';
import { CreateDeckSubscription } from '@/types/deck-subscription.types';
import { and, eq } from 'drizzle-orm';

export async function createDeckSubscription(deckSubscription: CreateDeckSubscription) {
  const existingSubscription = await db
    .select({ id: deckSubscriptions.id })
    .from(deckSubscriptions)
    .where(
      and(
        eq(deckSubscriptions.deckId, deckSubscription.deckId),
        eq(deckSubscriptions.userId, deckSubscription.userId),
      ),
    )
    .limit(1);

  if (existingSubscription.length > 0) {
    return;
  }

  await db.insert(deckSubscriptions).values({
    deckId: deckSubscription.deckId,
    userId: deckSubscription.userId,
  });
}
