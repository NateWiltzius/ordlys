create index if not exists "decks_owner_id_idx" on "decks" ("owner_id");
create index if not exists "decks_visibility_deleted_at_idx" on "decks" ("visibility", "deleted_at");
create index if not exists "deck_subscriptions_deck_id_idx" on "deck_subscriptions" ("deck_id");
create index if not exists "lessons_deck_id_order_index_idx" on "lessons" ("deck_id", "order_index");
create index if not exists "vocabs_lesson_id_order_index_idx" on "vocabs" ("lesson_id", "order_index");
create index if not exists "user_vocab_state_user_id_due_at_idx" on "user_vocab_state" ("user_id", "due_at");
