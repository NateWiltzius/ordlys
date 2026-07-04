ALTER TABLE "decks" ADD COLUMN "deleted_at" timestamp;

DELETE FROM "deck_subscriptions"
USING "decks"
WHERE "deck_subscriptions"."deck_id" = "decks"."id"
  AND "deck_subscriptions"."user_id" = "decks"."owner_id";
