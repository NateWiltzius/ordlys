alter table "decks" add column if not exists "source_deck_id" integer;

alter table "decks"
  add constraint "decks_source_deck_id_decks_id_fk"
  foreign key ("source_deck_id")
  references "decks" ("id")
  on delete set null;

create index if not exists "decks_source_deck_id_idx" on "decks" ("source_deck_id");
