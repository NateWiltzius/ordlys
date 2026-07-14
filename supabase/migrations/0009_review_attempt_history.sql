begin;

create type study_mode as enum ('learn', 'review', 'placement');
create type quiz_direction as enum ('btf', 'ftb');

create table review_attempts (
  id serial primary key,
  user_id uuid not null,
  vocab_id integer not null references vocabs(id) on delete cascade,
  mode study_mode not null,
  direction quiz_direction not null,
  is_correct boolean not null,
  was_overridden boolean not null default false,
  attempted_at timestamp not null default now()
);

create index review_attempts_user_attempted_at_idx
  on review_attempts(user_id, attempted_at);
create index review_attempts_user_correct_attempted_at_idx
  on review_attempts(user_id, is_correct, attempted_at);
create index review_attempts_vocab_id_idx on review_attempts(vocab_id);

alter table public.review_attempts enable row level security;
revoke all privileges on table public.review_attempts from anon, authenticated;
revoke all privileges on sequence public.review_attempts_id_seq from anon, authenticated;

comment on table public.review_attempts is
  'Private directional study-attempt history. Access is restricted to trusted server-side database roles.';

commit;
