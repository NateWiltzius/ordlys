begin;

create table if not exists public.study_preferences (
  user_id uuid primary key,
  strict_progression boolean not null default false,
  daily_new_word_target integer not null default 10,
  time_zone varchar(100) not null default 'UTC',
  constraint study_preferences_daily_target_range check (daily_new_word_target between 1 and 100)
);

create table if not exists public.lesson_unlocks (
  user_id uuid not null,
  lesson_id integer not null references public.lessons(id) on delete cascade,
  created_at timestamp not null default now(),
  constraint lesson_unlocks_user_lesson_unique unique (user_id, lesson_id)
);

alter table public.study_preferences enable row level security;
alter table public.lesson_unlocks enable row level security;
revoke all on public.study_preferences, public.lesson_unlocks from anon, authenticated;

commit;
