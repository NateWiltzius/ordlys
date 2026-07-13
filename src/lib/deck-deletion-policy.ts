const DECK_DELETION_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export function getDeckDeletionRetentionUntil(
  deletedAt: Date,
  protectedFollowerCount: number,
): Date {
  return new Date(
    deletedAt.getTime() + (protectedFollowerCount > 0 ? DECK_DELETION_RETENTION_MS : 0),
  );
}

export function canFinalizeDeckDeletion(
  protectedFollowerCount: number,
  retentionUntil: Date | null,
  now = new Date(),
): boolean {
  return (
    protectedFollowerCount === 0 ||
    (retentionUntil !== null && retentionUntil.getTime() <= now.getTime())
  );
}
