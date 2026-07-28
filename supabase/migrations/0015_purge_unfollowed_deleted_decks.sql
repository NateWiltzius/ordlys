begin;

-- A deleted deck's own release history is part of its purgeable content graph.
-- Only a current learner or surviving fork lineage requires a tombstone.
create or replace function private.deck_can_be_purged(target_deck_id integer)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.decks deck
    where deck.id = target_deck_id
      and deck.status = 'deleted'
      and not exists (
        select 1
        from public.deck_follows follow_row
        where follow_row.deck_id = deck.id
          and follow_row.status in ('active', 'frozen')
      )
      and not exists (
        select 1
        from public.decks descendant
        where descendant.id <> deck.id
          and (descendant.source_deck_id = deck.id or descendant.root_deck_id = deck.id)
      )
      and not exists (
        select 1
        from public.decks descendant
        join public.deck_releases source_release
          on source_release.id = descendant.source_release_id
        where descendant.id <> deck.id
          and source_release.deck_id = deck.id
      )
      and not exists (
        select 1
        from public.deck_releases derived_release
        join public.deck_releases source_release
          on source_release.id = derived_release.derived_from_release_id
        where derived_release.deck_id <> deck.id
          and source_release.deck_id = deck.id
      )
  )
$$;

revoke all on function private.deck_can_be_purged(integer) from public, anon, authenticated;

-- Keep published data immutable during normal operation, but allow the trusted
-- purge path to delete the release graph of an eligible deleted deck.
create or replace function private.reject_immutable_release_change()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  purge_deck_id integer;
begin
  purge_deck_id := nullif(current_setting('ordlys.purge_deck_id', true), '')::integer;

  if tg_op = 'UPDATE' then
    if tg_table_name in ('deck_releases', 'lesson_revisions', 'vocab_revisions')
      and (to_jsonb(new) - 'creator_id') = (to_jsonb(old) - 'creator_id')
      and to_jsonb(new) ->> 'creator_id' = '00000000-0000-0000-0000-000000000000' then
      return new;
    end if;
  end if;

  -- Browser roles cannot mutate these tables. The trusted purge path sets this
  -- transaction-local marker only after checking and locking the deleted deck.
  if tg_op = 'DELETE' and purge_deck_id is not null then
    return old;
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
  'Rejects release mutations except account anonymization and trusted purging of an unreferenced deleted deck.';

create or replace function private.purge_unfollowed_deck_tombstones()
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
      and private.deck_can_be_purged(deck.id)
    for update of deck
  loop
    begin
      perform set_config('ordlys.purge_deck_id', candidate.id::text, true);

      update public.deck_audit_events set deck_id = null where deck_id = candidate.id;
      delete from public.deck_reports where deck_id = candidate.id;
      delete from public.deck_follows where deck_id = candidate.id;
      update public.decks set current_release_id = null where id = candidate.id;

      delete from public.release_vocabs membership
      using public.deck_releases release_row
      where membership.release_id = release_row.id
        and release_row.deck_id = candidate.id;

      delete from public.release_lessons membership
      using public.deck_releases release_row
      where membership.release_id = release_row.id
        and release_row.deck_id = candidate.id;

      delete from public.deck_releases where deck_id = candidate.id;

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
      perform set_config('ordlys.purge_deck_id', '', true);
    exception
      when foreign_key_violation or raise_exception then
        -- Preserve a tombstone if an unexpected external dependency exists.
        perform set_config('ordlys.purge_deck_id', '', true);
        null;
    end;
  end loop;

  return removed_count;
end
$$;

revoke all on function private.purge_unfollowed_deck_tombstones()
  from public, anon, authenticated;

select private.purge_unfollowed_deck_tombstones();

commit;
