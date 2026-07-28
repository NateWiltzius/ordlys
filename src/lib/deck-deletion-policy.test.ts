import { describe, expect, it } from 'vitest';
import {
  canFinalizeDeckDeletion,
  getDeckDeletionRetentionUntil,
  requiresDeckTombstone,
} from './deck-deletion-policy';

const deletedAt = new Date('2026-07-13T12:00:00.000Z');

describe('deck deletion policy', () => {
  it('does not retain an unreferenced deck just for its audit history', () => {
    expect(
      requiresDeckTombstone({
        lineageCount: 0,
      }),
    ).toBe(false);
  });

  it('retains a deck needed by surviving fork lineage', () => {
    expect(requiresDeckTombstone({ lineageCount: 1 })).toBe(true);
  });

  it('does not retain a finalized deck for its own releases or follow relationships', () => {
    expect(requiresDeckTombstone({ lineageCount: 0 })).toBe(false);
  });

  it('allows a deck without followers to be finalized immediately', () => {
    expect(getDeckDeletionRetentionUntil(deletedAt, 0)).toEqual(deletedAt);
    expect(canFinalizeDeckDeletion(0, new Date('2026-08-12T12:00:00.000Z'), deletedAt)).toBe(true);
  });

  it('retains a deck with followers for 30 days', () => {
    const retentionUntil = getDeckDeletionRetentionUntil(deletedAt, 1);

    expect(retentionUntil).toEqual(new Date('2026-08-12T12:00:00.000Z'));
    expect(canFinalizeDeckDeletion(1, retentionUntil, deletedAt)).toBe(false);
    expect(canFinalizeDeckDeletion(1, retentionUntil, retentionUntil)).toBe(true);
  });

  it('allows immediate finalization when the last follower leaves', () => {
    const retentionUntil = getDeckDeletionRetentionUntil(deletedAt, 2);
    const oneDayLater = new Date('2026-07-14T12:00:00.000Z');

    expect(canFinalizeDeckDeletion(0, retentionUntil, oneDayLater)).toBe(true);
  });
});
