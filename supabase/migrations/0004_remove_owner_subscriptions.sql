delete from "deck_subscriptions"
using "decks"
where "deck_subscriptions"."deck_id" = "decks"."id"
  and "deck_subscriptions"."user_id" = "decks"."owner_id";

delete from "decks"
where "decks"."deleted_at" is not null
  and not exists (
    select 1
    from "deck_subscriptions"
    where "deck_subscriptions"."deck_id" = "decks"."id"
  );
