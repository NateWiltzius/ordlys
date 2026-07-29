import { randomUUID } from 'node:crypto';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { describe, expect, it } from 'vitest';
import { and, eq } from 'drizzle-orm';
import { deckFollows, deckReleases, decks, lessons, vocabs } from '../schema';
import { accessibleReleaseCondition, activeReleaseIdExpression } from './deck-access';
import { activeEditableLessonCondition, activeEditableVocabCondition } from './authoring-access';
import {
  canAccessRelease,
  resolveAccessibleReleaseId,
  type ReleaseAccessDeck,
  type ReleaseAccessFollow,
} from '../../lib/deck-access-policy';

const contractDatabaseUrl = process.env.DATABASE_URL?.trim();

if (!contractDatabaseUrl) {
  throw new Error('DATABASE_URL is required for database contract tests.');
}

describe('deck access SQL/TypeScript policy contract', () => {
  it('keeps SQL release resolution in parity with the domain policy', async () => {
    const connection = postgres(contractDatabaseUrl, {
      max: 1,
      prepare: false,
      ssl: contractDatabaseUrl.includes('localhost') ? false : 'require',
    });
    const database = drizzle({ client: connection });
    const rollback = new Error('ROLLBACK_CONTRACT_FIXTURES');

    try {
      await database.transaction(async transaction => {
        const userId = randomUUID();
        const ownerId = randomUUID();
        const cases: Array<{
          name: string;
          allowPublic: boolean;
          deck: Omit<ReleaseAccessDeck, 'currentReleaseId'>;
          follow?: Omit<ReleaseAccessFollow, 'pinnedReleaseId' | 'lastSeenReleaseId'> & {
            pinned: 'previous' | 'current' | null;
            lastSeen: 'previous' | 'current' | null;
          };
        }> = [
          {
            name: 'owner view',
            allowPublic: true,
            deck: { ownerId: userId, status: 'active', visibility: 'private' },
          },
          {
            name: 'public view',
            allowPublic: true,
            deck: { ownerId, status: 'active', visibility: 'public' },
          },
          {
            name: 'automatic follow',
            allowPublic: false,
            deck: { ownerId, status: 'active', visibility: 'private' },
            follow: {
              status: 'active',
              updateMode: 'automatic',
              pinned: null,
              lastSeen: 'previous',
            },
          },
          {
            name: 'manual follow',
            allowPublic: false,
            deck: { ownerId, status: 'active', visibility: 'public' },
            follow: {
              status: 'active',
              updateMode: 'manual',
              pinned: 'previous',
              lastSeen: 'current',
            },
          },
          {
            name: 'frozen follow',
            allowPublic: false,
            deck: { ownerId, status: 'deleted', visibility: 'private' },
            follow: {
              status: 'frozen',
              updateMode: 'automatic',
              pinned: null,
              lastSeen: 'previous',
            },
          },
          {
            name: 'moderation removal',
            allowPublic: true,
            deck: { ownerId: userId, status: 'moderation_removed', visibility: 'public' },
          },
        ];

        for (const contractCase of cases) {
          const [createdDeck] = await transaction
            .insert(decks)
            .values({
              ownerId: contractCase.deck.ownerId,
              title: `Contract: ${contractCase.name}`,
              status: contractCase.deck.status,
              visibility: contractCase.deck.visibility,
            })
            .returning({ id: decks.id });
          const [previousRelease, currentRelease] = await transaction
            .insert(deckReleases)
            .values([
              {
                deckId: createdDeck.id,
                version: 1,
                title: 'Previous',
                copyPolicy: 'follow_only',
                contentHash: 'previous',
                changeSummary: 'Previous',
                creatorId: ownerId,
              },
              {
                deckId: createdDeck.id,
                version: 2,
                title: 'Current',
                copyPolicy: 'follow_only',
                contentHash: 'current',
                changeSummary: 'Current',
                creatorId: ownerId,
              },
            ])
            .returning({ id: deckReleases.id });
          await transaction
            .update(decks)
            .set({ currentReleaseId: currentRelease.id })
            .where(eq(decks.id, createdDeck.id));

          let follow: ReleaseAccessFollow | null = null;
          if (contractCase.follow) {
            const releaseId = (value: 'previous' | 'current' | null) =>
              value === 'previous'
                ? previousRelease.id
                : value === 'current'
                  ? currentRelease.id
                  : null;
            follow = {
              status: contractCase.follow.status,
              updateMode: contractCase.follow.updateMode,
              pinnedReleaseId: releaseId(contractCase.follow.pinned),
              lastSeenReleaseId: releaseId(contractCase.follow.lastSeen),
            };
            await transaction.insert(deckFollows).values({
              userId,
              deckId: createdDeck.id,
              status: follow.status,
              updateMode: follow.updateMode,
              pinnedReleaseId: follow.pinnedReleaseId,
              lastSeenReleaseId: follow.lastSeenReleaseId,
            });
          }

          const [sqlResult] = await transaction
            .select({ releaseId: activeReleaseIdExpression(userId, contractCase.allowPublic) })
            .from(decks)
            .where(eq(decks.id, createdDeck.id));
          const expected = resolveAccessibleReleaseId({
            deck: {
              ...contractCase.deck,
              currentReleaseId: currentRelease.id,
            },
            follow,
            userId,
            allowPublic: contractCase.allowPublic,
          });

          expect(sqlResult.releaseId, contractCase.name).toBe(expected);

          for (const releaseId of [previousRelease.id, currentRelease.id]) {
            const sqlAccess = await transaction
              .select({ id: deckReleases.id })
              .from(deckReleases)
              .innerJoin(decks, eq(decks.id, deckReleases.deckId))
              .leftJoin(
                deckFollows,
                and(eq(deckFollows.deckId, decks.id), eq(deckFollows.userId, userId)),
              )
              .where(
                and(
                  eq(deckReleases.id, releaseId),
                  accessibleReleaseCondition(userId, contractCase.allowPublic),
                ),
              )
              .limit(1);
            const expectedAccess = canAccessRelease({
              deck: {
                ...contractCase.deck,
                currentReleaseId: currentRelease.id,
              },
              follow,
              userId,
              releaseId,
              allowPublicCurrent: contractCase.allowPublic,
            });

            expect(Boolean(sqlAccess.length), `${contractCase.name} release ${releaseId}`).toBe(
              expectedAccess,
            );
          }
        }

        const [authoringDeck] = await transaction
          .insert(decks)
          .values({ ownerId: userId, title: 'Authoring contract' })
          .returning({ id: decks.id });
        const [activeLesson, removedLesson] = await transaction
          .insert(lessons)
          .values([
            { deckId: authoringDeck.id, title: 'Active lesson', orderIndex: 0 },
            {
              deckId: authoringDeck.id,
              title: 'Removed lesson',
              orderIndex: 1,
              removedAt: new Date(),
            },
          ])
          .returning({ id: lessons.id });
        const [activeVocab, removedVocab, nestedUnderRemovedLesson] = await transaction
          .insert(vocabs)
          .values([
            { lessonId: activeLesson.id, front: 'active', back: 'active', orderIndex: 0 },
            {
              lessonId: activeLesson.id,
              front: 'removed',
              back: 'removed',
              orderIndex: 1,
              removedAt: new Date(),
            },
            {
              lessonId: removedLesson.id,
              front: 'hidden',
              back: 'hidden',
              orderIndex: 0,
            },
          ])
          .returning({ id: vocabs.id });

        const editableLesson = (lessonId: number) =>
          transaction
            .select({ id: lessons.id })
            .from(lessons)
            .innerJoin(decks, eq(decks.id, lessons.deckId))
            .where(activeEditableLessonCondition(lessonId, userId));
        const editableVocab = (vocabId: number) =>
          transaction
            .select({ id: vocabs.id })
            .from(vocabs)
            .innerJoin(lessons, eq(lessons.id, vocabs.lessonId))
            .innerJoin(decks, eq(decks.id, lessons.deckId))
            .where(activeEditableVocabCondition(vocabId, userId));

        expect(await editableLesson(activeLesson.id)).toHaveLength(1);
        expect(await editableLesson(removedLesson.id)).toHaveLength(0);
        expect(await editableVocab(activeVocab.id)).toHaveLength(1);
        expect(await editableVocab(removedVocab.id)).toHaveLength(0);
        expect(await editableVocab(nestedUnderRemovedLesson.id)).toHaveLength(0);

        throw rollback;
      });
    } catch (error) {
      if (error !== rollback) throw error;
    } finally {
      await connection.end();
    }
  });
});
