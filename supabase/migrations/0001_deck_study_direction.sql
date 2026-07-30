create type "public"."deck_study_direction" as enum ('both', 'ftb', 'btf');

alter table "public"."decks"
  add column "study_direction" "public"."deck_study_direction" default 'both' not null;

alter table "public"."deck_releases"
  add column "study_direction" "public"."deck_study_direction" default 'both' not null;
