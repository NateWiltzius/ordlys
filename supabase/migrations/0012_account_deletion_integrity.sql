begin;

-- Match the Drizzle invariant after upgrading databases created before visibility
-- became required.
update public.decks
set visibility = 'private'
where visibility is null;

alter table public.decks
  alter column visibility set default 'private',
  alter column visibility set not null;

-- Releases remain immutable except for removing the creator identifier during an
-- explicitly requested account deletion. Browser roles have no write privileges.
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

  raise exception 'immutable release data cannot be changed';
end
$$;

comment on function private.reject_immutable_release_change() is
  'Rejects release mutations except creator-ID anonymization to the reserved anonymous UUID.';

commit;
