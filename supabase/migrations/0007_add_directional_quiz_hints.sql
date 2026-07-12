alter table public.vocabs
  add column if not exists front_to_back_quiz_hint varchar(255),
  add column if not exists back_to_front_quiz_hint varchar(255);

alter table public.vocab_revisions
  add column if not exists front_to_back_quiz_hint varchar(255),
  add column if not exists back_to_front_quiz_hint varchar(255);
