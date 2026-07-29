begin;

-- Drizzle owns the relational schema. Run `npm run drizzle-push` before this
-- file to install the security and integrity rules that Drizzle cannot express.
create schema if not exists private;

grant usage on schema private to authenticated;

create or replace function private.owns_deck(target_deck_id integer)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.decks
    where id = target_deck_id
      and owner_id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function private.can_view_deck(target_deck_id integer)
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
      and deck.status <> 'moderation_removed'
      and (
        deck.owner_id = auth.uid()
        or (
          deck.status = 'active'
          and deck.visibility in ('public', 'unlisted')
        )
        or exists (
          select 1
          from public.deck_follows follow_row
          where follow_row.deck_id = deck.id
            and follow_row.user_id = auth.uid()
            and follow_row.status in ('active', 'frozen')
        )
      )
  );
$$;

create or replace function private.can_study_deck(target_deck_id integer)
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
      and deck.status <> 'moderation_removed'
      and (
        deck.owner_id = auth.uid()
        or exists (
          select 1
          from public.deck_follows follow_row
          where follow_row.deck_id = deck.id
            and follow_row.user_id = auth.uid()
            and follow_row.status in ('active', 'frozen')
        )
      )
  );
$$;

create or replace function private.can_view_lesson(target_lesson_id integer)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.lessons
    where id = target_lesson_id
      and private.can_view_deck(deck_id)
  );
$$;

create or replace function private.can_edit_lesson(target_lesson_id integer)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.lessons
    where id = target_lesson_id
      and private.owns_deck(deck_id)
  );
$$;

create or replace function private.can_view_vocab(target_vocab_id integer)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.vocabs
    inner join public.lessons on lessons.id = vocabs.lesson_id
    where vocabs.id = target_vocab_id
      and private.can_view_deck(lessons.deck_id)
  );
$$;

create or replace function private.can_study_vocab(target_vocab_id integer)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.vocabs
    inner join public.lessons on lessons.id = vocabs.lesson_id
    where vocabs.id = target_vocab_id
      and private.can_study_deck(lessons.deck_id)
  );
$$;

create or replace function private.can_edit_vocab(target_vocab_id integer)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.vocabs
    inner join public.lessons on lessons.id = vocabs.lesson_id
    where vocabs.id = target_vocab_id
      and private.owns_deck(lessons.deck_id)
  );
$$;

grant execute on function private.owns_deck(integer) to authenticated;
grant execute on function private.can_view_deck(integer) to authenticated;
grant execute on function private.can_study_deck(integer) to authenticated;
grant execute on function private.can_view_lesson(integer) to authenticated;
grant execute on function private.can_edit_lesson(integer) to authenticated;
grant execute on function private.can_view_vocab(integer) to authenticated;
grant execute on function private.can_study_vocab(integer) to authenticated;
grant execute on function private.can_edit_vocab(integer) to authenticated;

-- Browser roles never access application tables directly. RLS remains enabled as
-- defense in depth and documents the intended read boundaries.
do $$
declare
  table_name text;
begin
  for table_name in
    select tablename
    from pg_tables
    where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format(
      'revoke all privileges on table public.%I from anon, authenticated',
      table_name
    );
  end loop;
end
$$;

revoke all privileges on all sequences in schema public from anon, authenticated;

alter default privileges in schema public
  revoke all privileges on tables from anon, authenticated;
alter default privileges in schema public
  revoke all privileges on sequences from anon, authenticated;

drop policy if exists "authenticated users can view accessible decks" on public.decks;
create policy "authenticated users can view accessible decks"
on public.decks
for select
to authenticated
using (private.can_view_deck(id));

drop policy if exists "authenticated users can create their own decks" on public.decks;
create policy "authenticated users can create their own decks"
on public.decks
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "deck owners can update their active decks" on public.decks;
create policy "deck owners can update their active decks"
on public.decks
for update
to authenticated
using (private.owns_deck(id))
with check (owner_id = auth.uid());

drop policy if exists "deck owners can delete their active decks" on public.decks;
create policy "deck owners can delete their active decks"
on public.decks
for delete
to authenticated
using (private.owns_deck(id));

drop policy if exists "authenticated users can view accessible lessons" on public.lessons;
create policy "authenticated users can view accessible lessons"
on public.lessons
for select
to authenticated
using (private.can_view_lesson(id));

drop policy if exists "deck owners can create lessons" on public.lessons;
create policy "deck owners can create lessons"
on public.lessons
for insert
to authenticated
with check (private.owns_deck(deck_id));

drop policy if exists "deck owners can update lessons" on public.lessons;
create policy "deck owners can update lessons"
on public.lessons
for update
to authenticated
using (private.can_edit_lesson(id))
with check (private.owns_deck(deck_id));

drop policy if exists "deck owners can delete lessons" on public.lessons;
create policy "deck owners can delete lessons"
on public.lessons
for delete
to authenticated
using (private.can_edit_lesson(id));

drop policy if exists "authenticated users can view accessible vocab" on public.vocabs;
create policy "authenticated users can view accessible vocab"
on public.vocabs
for select
to authenticated
using (private.can_view_vocab(id));

drop policy if exists "deck owners can create vocab" on public.vocabs;
create policy "deck owners can create vocab"
on public.vocabs
for insert
to authenticated
with check (
  exists (
    select 1
    from public.lessons
    where lessons.id = lesson_id
      and private.owns_deck(lessons.deck_id)
  )
);

drop policy if exists "deck owners can update vocab" on public.vocabs;
create policy "deck owners can update vocab"
on public.vocabs
for update
to authenticated
using (private.can_edit_vocab(id))
with check (
  exists (
    select 1
    from public.lessons
    where lessons.id = lesson_id
      and private.owns_deck(lessons.deck_id)
  )
);

drop policy if exists "deck owners can delete vocab" on public.vocabs;
create policy "deck owners can delete vocab"
on public.vocabs
for delete
to authenticated
using (private.can_edit_vocab(id));

drop policy if exists "authenticated users can view their vocab state"
  on public.user_vocab_state;
create policy "authenticated users can view their vocab state"
on public.user_vocab_state
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "authenticated users can create their vocab state"
  on public.user_vocab_state;
create policy "authenticated users can create their vocab state"
on public.user_vocab_state
for insert
to authenticated
with check (user_id = auth.uid() and private.can_study_vocab(vocab_id));

drop policy if exists "authenticated users can update their vocab state"
  on public.user_vocab_state;
create policy "authenticated users can update their vocab state"
on public.user_vocab_state
for update
to authenticated
using (user_id = auth.uid() and private.can_study_vocab(vocab_id))
with check (user_id = auth.uid() and private.can_study_vocab(vocab_id));

drop policy if exists "authenticated users can delete their vocab state"
  on public.user_vocab_state;
create policy "authenticated users can delete their vocab state"
on public.user_vocab_state
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "users can view accessible releases" on public.deck_releases;
create policy "users can view accessible releases"
on public.deck_releases
for select
to authenticated
using (private.can_view_deck(deck_id));

drop policy if exists "users can view accessible release lessons" on public.release_lessons;
create policy "users can view accessible release lessons"
on public.release_lessons
for select
to authenticated
using (
  exists (
    select 1
    from public.deck_releases release_row
    where release_row.id = release_id
      and private.can_view_deck(release_row.deck_id)
  )
);

drop policy if exists "users can view accessible release vocab" on public.release_vocabs;
create policy "users can view accessible release vocab"
on public.release_vocabs
for select
to authenticated
using (
  exists (
    select 1
    from public.deck_releases release_row
    where release_row.id = release_id
      and private.can_view_deck(release_row.deck_id)
  )
);

drop policy if exists "users can view accessible lesson revisions"
  on public.lesson_revisions;
create policy "users can view accessible lesson revisions"
on public.lesson_revisions
for select
to authenticated
using (
  exists (
    select 1
    from public.lessons lesson
    where lesson.id = lesson_id
      and private.can_view_deck(lesson.deck_id)
  )
  or exists (
    select 1
    from public.release_lessons membership
    inner join public.deck_releases release_row
      on release_row.id = membership.release_id
    where membership.revision_id = lesson_revisions.id
      and private.can_view_deck(release_row.deck_id)
  )
);

drop policy if exists "users can view accessible vocab revisions"
  on public.vocab_revisions;
create policy "users can view accessible vocab revisions"
on public.vocab_revisions
for select
to authenticated
using (
  exists (
    select 1
    from public.vocabs vocab
    inner join public.lessons lesson on lesson.id = vocab.lesson_id
    where vocab.id = vocab_id
      and private.can_view_deck(lesson.deck_id)
  )
  or exists (
    select 1
    from public.release_vocabs membership
    inner join public.deck_releases release_row
      on release_row.id = membership.release_id
    where membership.revision_id = vocab_revisions.id
      and private.can_view_deck(release_row.deck_id)
  )
);

drop policy if exists "users view their follows" on public.deck_follows;
create policy "users view their follows"
on public.deck_follows
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "users create reports" on public.deck_reports;
create policy "users create reports"
on public.deck_reports
for insert
to authenticated
with check (reporter_id = auth.uid());

-- Published releases are immutable. The trusted server may anonymize creator
-- IDs during account deletion, remove unpublished revisions, or purge a deleted
-- deck after setting the transaction-local marker used below.
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

  if tg_op = 'DELETE' and purge_deck_id is not null then
    return old;
  end if;

  if tg_op = 'DELETE' and tg_table_name = 'lesson_revisions'
    and not exists (
      select 1
      from public.release_lessons
      where revision_id = old.id
    ) then
    return old;
  end if;

  if tg_op = 'DELETE' and tg_table_name = 'vocab_revisions'
    and not exists (
      select 1
      from public.release_vocabs
      where revision_id = old.id
    ) then
    return old;
  end if;

  raise exception 'immutable release data cannot be changed';
end
$$;

drop trigger if exists immutable_deck_releases on public.deck_releases;
create trigger immutable_deck_releases
before update or delete on public.deck_releases
for each row execute function private.reject_immutable_release_change();

drop trigger if exists immutable_release_lessons on public.release_lessons;
create trigger immutable_release_lessons
before update or delete on public.release_lessons
for each row execute function private.reject_immutable_release_change();

drop trigger if exists immutable_release_vocabs on public.release_vocabs;
create trigger immutable_release_vocabs
before update or delete on public.release_vocabs
for each row execute function private.reject_immutable_release_change();

drop trigger if exists immutable_lesson_revisions on public.lesson_revisions;
create trigger immutable_lesson_revisions
before update or delete on public.lesson_revisions
for each row execute function private.reject_immutable_release_change();

drop trigger if exists immutable_vocab_revisions on public.vocab_revisions;
create trigger immutable_vocab_revisions
before update or delete on public.vocab_revisions
for each row execute function private.reject_immutable_release_change();

comment on table public.feedback is
  'Private user feedback. Access is restricted to trusted server-side database roles.';
comment on table public.review_attempts is
  'Private directional study-attempt history. Access is restricted to trusted server-side database roles.';
comment on column public.review_attempts.idempotency_key is
  'Client-generated retry key. A directional attempt and its optional SRS transition are committed once.';
comment on column public.review_attempts.session_id is
  'Server-validated quiz session used to derive two-direction card completion and SRS outcomes.';
comment on function private.reject_immutable_release_change() is
  'Rejects release mutations except account anonymization, unpublished revision deletion, and trusted purging of an unreferenced deleted deck.';

commit;
