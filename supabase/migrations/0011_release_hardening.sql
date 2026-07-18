begin;

-- Server-side Drizzle queries use the trusted database role. Browser roles must
-- never receive table access, even when a future table is added without a policy.
do $$
declare
  table_name text;
begin
  for table_name in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format(
      'revoke all privileges on table public.%I from anon, authenticated',
      table_name
    );
  end loop;
end $$;

revoke all privileges on all sequences in schema public from anon, authenticated;
alter default privileges in schema public
  revoke all privileges on tables from anon, authenticated;
alter default privileges in schema public
  revoke all privileges on sequences from anon, authenticated;

alter table public.review_attempts
  add column idempotency_key varchar(128);

create unique index review_attempts_user_idempotency_key_unique
  on public.review_attempts(user_id, idempotency_key);

create index feedback_user_id_idx on public.feedback(user_id);

comment on column public.review_attempts.idempotency_key is
  'Client-generated retry key. A directional attempt and its optional SRS transition are committed once.';

commit;
