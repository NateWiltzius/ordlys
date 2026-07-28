begin;

-- Audit history does not require a live deck row. Preserve the event and detach
-- it automatically when an otherwise unreferenced deck is physically removed.
do $$
declare
  foreign_key_name text;
begin
  for foreign_key_name in
    select constraint_row.conname
    from pg_constraint constraint_row
    where constraint_row.contype = 'f'
      and constraint_row.conrelid = 'public.deck_audit_events'::regclass
      and constraint_row.confrelid = 'public.decks'::regclass
  loop
    execute format(
      'alter table public.deck_audit_events drop constraint %I',
      foreign_key_name
    );
  end loop;
end
$$;

alter table public.deck_audit_events
  add constraint deck_audit_events_deck_id_fkey
  foreign key (deck_id) references public.decks(id) on delete set null;

-- Draft revisions may be removed only when no immutable release references them.
-- Published release data remains protected by the same trigger.
create or replace function private.reject_immutable_release_change()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'UPDATE' then
    if tg_table_name in ('deck_releases', 'lesson_revisions', 'vocab_revisions')
      and (to_jsonb(new) - 'creator_id') = (to_jsonb(old) - 'creator_id')
      and to_jsonb(new) ->> 'creator_id' = '00000000-0000-0000-0000-000000000000' then
      return new;
    end if;
  end if;

  if tg_op = 'DELETE' and tg_table_name = 'lesson_revisions'
    and not exists (
      select 1 from public.release_lessons where revision_id = old.id
    ) then
    return old;
  end if;

  if tg_op = 'DELETE' and tg_table_name = 'vocab_revisions'
    and not exists (
      select 1 from public.release_vocabs where revision_id = old.id
    ) then
    return old;
  end if;

  raise exception 'immutable release data cannot be changed';
end
$$;

comment on function private.reject_immutable_release_change() is
  'Rejects release mutations, except creator-ID anonymization and deletion of revisions unused by a release.';

-- This maintenance function is intentionally unavailable to browser roles. It
-- can be rerun safely by migrations or an operator after repairing legacy data.
create or replace function private.purge_orphaned_deck_tombstones()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  candidate record;
  removed_count integer := 0;
begin
  for candidate in
    select deck.id
    from public.decks deck
    where deck.owner_id = '00000000-0000-0000-0000-000000000000'
      and deck.title = '[deleted deck]'
      and deck.status = 'deleted'
      and not exists (
        select 1 from public.deck_releases release_row where release_row.deck_id = deck.id
      )
      and not exists (
        select 1 from public.deck_follows follow_row where follow_row.deck_id = deck.id
      )
      and not exists (
        select 1
        from public.decks descendant
        where descendant.id <> deck.id
          and (descendant.source_deck_id = deck.id or descendant.root_deck_id = deck.id)
      )
    for update of deck
  loop
    begin
      update public.deck_audit_events set deck_id = null where deck_id = candidate.id;
      delete from public.deck_reports where deck_id = candidate.id;

      update public.vocabs
      set current_revision_id = null
      where lesson_id in (
        select id from public.lessons where deck_id = candidate.id
      );
      update public.lessons set current_revision_id = null where deck_id = candidate.id;

      delete from public.vocab_revisions revision
      using public.vocabs vocab, public.lessons lesson
      where revision.vocab_id = vocab.id
        and vocab.lesson_id = lesson.id
        and lesson.deck_id = candidate.id;

      delete from public.vocabs vocab
      using public.lessons lesson
      where vocab.lesson_id = lesson.id
        and lesson.deck_id = candidate.id;

      delete from public.lesson_revisions revision
      using public.lessons lesson
      where revision.lesson_id = lesson.id
        and lesson.deck_id = candidate.id;

      delete from public.lessons where deck_id = candidate.id;
      delete from public.decks where id = candidate.id;
      removed_count := removed_count + 1;
    exception
      when foreign_key_violation or raise_exception then
        -- Leave tombstones with an unexpected external reference intact.
        null;
    end;
  end loop;

  return removed_count;
end
$$;

revoke all on function private.purge_orphaned_deck_tombstones() from public, anon, authenticated;

-- Backfill cleanup for tombstones created before audit events stopped blocking
-- physical deletion.
select private.purge_orphaned_deck_tombstones();

commit;
