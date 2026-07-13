-- Decks without active or frozen followers do not need the 30-day protection window.
update decks d
set retention_until = coalesce(d.deleted_at, now())
where d.status = 'deleted'
  and d.retention_until > now()
  and not exists (
    select 1
    from deck_follows f
    where f.deck_id = d.id
      and f.status in ('active', 'frozen')
  );
