alter table "decks"
  add column "is_editable_copy" boolean not null default false;

update "decks"
set "is_editable_copy" = true
where "source_deck_id" is not null;

alter table "vocabs"
  add column "source_vocab_id" integer;

alter table "vocabs"
  add constraint "vocabs_source_vocab_id_vocabs_id_fk"
  foreign key ("source_vocab_id")
  references "vocabs" ("id")
  on delete set null;

create index "vocabs_source_vocab_id_idx" on "vocabs" ("source_vocab_id");
