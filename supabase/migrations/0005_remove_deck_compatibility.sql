-- The release/follow paths have been verified. Remove the migration-only compatibility schema.
DROP FUNCTION IF EXISTS private.can_subscribe_deck(integer);
DROP TABLE IF EXISTS deck_subscriptions;
ALTER TABLE decks DROP COLUMN IF EXISTS is_editable_copy;
