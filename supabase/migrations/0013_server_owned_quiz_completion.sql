begin;

alter table public.review_attempts
  add column session_id uuid;

-- Historical attempts predate session tracking. Giving each one a unique session
-- prevents old rows from combining into a synthetic card completion.
update public.review_attempts
set session_id = gen_random_uuid()
where session_id is null;

alter table public.review_attempts
  alter column session_id set not null;

create index review_attempts_session_card_idx
  on public.review_attempts(user_id, session_id, vocab_id, mode, attempted_at);

comment on column public.review_attempts.session_id is
  'Server-validated quiz session used to derive two-direction card completion and SRS outcomes.';

commit;
