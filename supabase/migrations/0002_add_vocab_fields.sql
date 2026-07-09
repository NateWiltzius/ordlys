alter table public.vocabs
  add column if not exists tags varchar[] not null default ARRAY[]::varchar[],
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists notes text;
