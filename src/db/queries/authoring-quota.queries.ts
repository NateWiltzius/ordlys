import { db } from '@/db';
import { sql } from 'drizzle-orm';
import type { AuthoringUsage } from '@/lib/authoring-quota';

type SqlExecutor = Pick<typeof db, 'execute'>;

type UsageRow = {
  active_decks: number;
  public_decks: number;
  deck_cards: number;
  logical_vocabs: number;
  revisions_today: number;
};

export async function lockAuthoringAccount(executor: SqlExecutor, userId: string): Promise<void> {
  await executor.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`);
}

export async function getAuthoringUsage(
  executor: SqlExecutor,
  userId: string,
  deckId?: number,
): Promise<AuthoringUsage> {
  const rows = await executor.execute<UsageRow>(sql`
    select
      (select count(*) from decks where owner_id=${userId} and status='active')::int as active_decks,
      (select count(*) from decks where owner_id=${userId} and visibility='public'
        and status='active')::int as public_decks,
      (select count(*) from vocabs v join lessons l on l.id=v.lesson_id
        where l.deck_id=${deckId ?? null} and v.removed_at is null)::int as deck_cards,
      (select count(*) from vocabs v join lessons l on l.id=v.lesson_id
        join decks d on d.id=l.deck_id where d.owner_id=${userId})::int as logical_vocabs,
      ((select count(*) from vocab_revisions where creator_id=${userId}
          and created_at >= now() - interval '1 day') +
       (select count(*) from lesson_revisions where creator_id=${userId}
          and created_at >= now() - interval '1 day'))::int as revisions_today
  `);
  const usage = rows[0];

  return {
    activeDecks: Number(usage?.active_decks ?? 0),
    publicDecks: Number(usage?.public_decks ?? 0),
    deckCards: Number(usage?.deck_cards ?? 0),
    logicalVocabs: Number(usage?.logical_vocabs ?? 0),
    revisionsToday: Number(usage?.revisions_today ?? 0),
  };
}
