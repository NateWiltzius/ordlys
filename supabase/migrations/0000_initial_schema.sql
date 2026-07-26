begin;

-- Bootstrap the pre-release schema expected by migrations 0001-0003.
-- Existing installations already have deck_releases, so an out-of-order application
-- of this migration must not recreate the removed deck_subscriptions compatibility table.
do $$
begin
  if to_regclass('public.decks') is null
    and to_regclass('public.deck_releases') is null then
    create type public.visibility as enum ('private', 'public');

    create table public.decks (
      id serial primary key,
      owner_id uuid not null,
      title varchar(255) not null,
      description varchar(255),
      front_language varchar(35),
      back_language varchar(35),
      visibility public.visibility,
      source_deck_id integer references public.decks(id) on delete set null,
      is_editable_copy boolean not null default false,
      deleted_at timestamp,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now()
    );

    create table public.deck_subscriptions (
      id serial primary key,
      user_id uuid not null,
      deck_id integer not null references public.decks(id) on delete cascade,
      created_at timestamp not null default now(),
      constraint deck_subscriptions_user_id_deck_id_unique unique(user_id, deck_id)
    );

    create table public.lessons (
      id serial primary key,
      deck_id integer not null references public.decks(id) on delete cascade,
      title varchar(255) not null,
      order_index integer not null default 0,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now()
    );

    create table public.vocabs (
      id serial primary key,
      source_vocab_id integer references public.vocabs(id) on delete set null,
      lesson_id integer not null references public.lessons(id) on delete cascade,
      front varchar(255) not null,
      back varchar(255) not null,
      front_alternatives varchar(255)[] not null default array[]::varchar[],
      back_alternatives varchar(255)[] not null default array[]::varchar[],
      reading varchar(255),
      order_index integer not null default 0,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now()
    );

    create table public.user_vocab_state (
      id serial primary key,
      user_id uuid not null,
      vocab_id integer not null references public.vocabs(id) on delete cascade,
      srs_level integer not null default 0,
      due_at timestamp not null,
      created_at timestamp not null default now(),
      updated_at timestamp not null default now(),
      constraint user_vocab_state_user_id_vocab_id_unique unique(user_id, vocab_id),
      constraint user_vocab_state_srs_level_range check(srs_level between 0 and 8)
    );

    create table public.feedback (
      id serial primary key,
      user_id uuid not null,
      category varchar(40) not null,
      message text not null,
      page_path varchar(255),
      contact_email varchar(320),
      created_at timestamp not null default now()
    );

    create index decks_owner_id_idx on public.decks(owner_id);
    create index decks_source_deck_id_idx on public.decks(source_deck_id);
    create index decks_visibility_deleted_at_idx on public.decks(visibility, deleted_at);
    create index deck_subscriptions_deck_id_idx on public.deck_subscriptions(deck_id);
    create index lessons_deck_id_order_index_idx on public.lessons(deck_id, order_index);
    create index vocabs_lesson_id_order_index_idx on public.vocabs(lesson_id, order_index);
    create index vocabs_source_vocab_id_idx on public.vocabs(source_vocab_id);
    create index user_vocab_state_user_id_due_at_idx
      on public.user_vocab_state(user_id, due_at);
    create index feedback_created_at_idx on public.feedback(created_at);
  end if;
end $$;

commit;
