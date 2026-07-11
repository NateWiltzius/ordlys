import { db } from '@/db';
import { deckAuditEvents, deckFollows, deckReports, decks, userVocabState } from '@/db/schema';
import { eq } from 'drizzle-orm';

const ANONYMOUS_OWNER_ID = '00000000-0000-0000-0000-000000000000';

export async function deleteAccountData(
  userId: string,
  deleteAuthenticationUser: () => Promise<void>,
) {
  await db.transaction(async tx => {
    const deletedAt = new Date();

    // Preserve releases, descendants, and provenance while removing the account identifier.
    await tx
      .update(decks)
      .set({
        ownerId: ANONYMOUS_OWNER_ID,
        status: 'deleted',
        catalogStatus: 'hidden',
        deletedAt,
        retentionUntil: null,
        updatedAt: deletedAt,
      })
      .where(eq(decks.ownerId, userId));
    await tx
      .update(deckAuditEvents)
      .set({ actorId: null })
      .where(eq(deckAuditEvents.actorId, userId));
    await tx.delete(deckReports).where(eq(deckReports.reporterId, userId));
    await tx.delete(userVocabState).where(eq(userVocabState.userId, userId));
    await tx.delete(deckFollows).where(eq(deckFollows.userId, userId));

    await deleteAuthenticationUser();
  });
}
