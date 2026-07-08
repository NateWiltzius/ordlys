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
      and deleted_at is null
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
    from public.decks
    where id = target_deck_id
      and (
        (deleted_at is null and (visibility = 'public' or owner_id = auth.uid()))
        or exists (
          select 1
          from public.deck_subscriptions
          where deck_id = target_deck_id
            and user_id = auth.uid()
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
    from public.decks
    where id = target_deck_id
      and (
        (owner_id = auth.uid() and deleted_at is null)
        or exists (
          select 1
          from public.deck_subscriptions
          where deck_id = target_deck_id
            and user_id = auth.uid()
        )
      )
  );
$$;

create or replace function private.can_subscribe_deck(target_deck_id integer)
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
      and visibility = 'public'
      and deleted_at is null
      and owner_id <> auth.uid()
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
grant execute on function private.can_subscribe_deck(integer) to authenticated;
grant execute on function private.can_view_lesson(integer) to authenticated;
grant execute on function private.can_edit_lesson(integer) to authenticated;
grant execute on function private.can_view_vocab(integer) to authenticated;
grant execute on function private.can_study_vocab(integer) to authenticated;
grant execute on function private.can_edit_vocab(integer) to authenticated;

alter table public.decks enable row level security;
alter table public.deck_subscriptions enable row level security;
alter table public.lessons enable row level security;
alter table public.vocabs enable row level security;
alter table public.user_vocab_state enable row level security;
alter table public.feedback enable row level security;

create policy "authenticated users can view accessible decks"
on public.decks
for select
to authenticated
using (private.can_view_deck(id));

create policy "authenticated users can create their own decks"
on public.decks
for insert
to authenticated
with check (owner_id = auth.uid());

create policy "deck owners can update their active decks"
on public.decks
for update
to authenticated
using (private.owns_deck(id))
with check (owner_id = auth.uid());

create policy "deck owners can delete their active decks"
on public.decks
for delete
to authenticated
using (private.owns_deck(id));

create policy "authenticated users can view their subscriptions"
on public.deck_subscriptions
for select
to authenticated
using (user_id = auth.uid());

create policy "authenticated users can subscribe to public decks"
on public.deck_subscriptions
for insert
to authenticated
with check (user_id = auth.uid() and private.can_subscribe_deck(deck_id));

create policy "authenticated users can remove their subscriptions"
on public.deck_subscriptions
for delete
to authenticated
using (user_id = auth.uid());

create policy "authenticated users can view accessible lessons"
on public.lessons
for select
to authenticated
using (private.can_view_lesson(id));

create policy "deck owners can create lessons"
on public.lessons
for insert
to authenticated
with check (private.owns_deck(deck_id));

create policy "deck owners can update lessons"
on public.lessons
for update
to authenticated
using (private.can_edit_lesson(id))
with check (private.owns_deck(deck_id));

create policy "deck owners can delete lessons"
on public.lessons
for delete
to authenticated
using (private.can_edit_lesson(id));

create policy "authenticated users can view accessible vocab"
on public.vocabs
for select
to authenticated
using (private.can_view_vocab(id));

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

create policy "deck owners can delete vocab"
on public.vocabs
for delete
to authenticated
using (private.can_edit_vocab(id));

create policy "authenticated users can view their vocab state"
on public.user_vocab_state
for select
to authenticated
using (user_id = auth.uid());

create policy "authenticated users can create their vocab state"
on public.user_vocab_state
for insert
to authenticated
with check (user_id = auth.uid() and private.can_study_vocab(vocab_id));

create policy "authenticated users can update their vocab state"
on public.user_vocab_state
for update
to authenticated
using (user_id = auth.uid() and private.can_study_vocab(vocab_id))
with check (user_id = auth.uid() and private.can_study_vocab(vocab_id));

create policy "authenticated users can delete their vocab state"
on public.user_vocab_state
for delete
to authenticated
using (user_id = auth.uid());

create policy "authenticated users can submit feedback"
on public.feedback
for insert
to authenticated
with check (user_id = auth.uid());
