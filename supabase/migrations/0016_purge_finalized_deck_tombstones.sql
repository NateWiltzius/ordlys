begin;

-- Active or frozen followers are protected by the deletion retention window.
-- Once a deck has been finalized into an anonymized tombstone, those follows
-- must not retain it forever. Only surviving fork lineage blocks graph purging.
create or replace function private.deck_can_be_purged(target_deck_id integer)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.decks deck
    where deck.id = target_deck_id
      and deck.status = 'deleted'
      and (
        (
          deck.owner_id = '00000000-0000-0000-0000-000000000000'
          and deck.title = '[deleted deck]'
        )
        or not exists (
          select 1
          from public.deck_follows follow_row
          where follow_row.deck_id = deck.id
            and follow_row.status in ('active', 'frozen')
        )
      )
      and not exists (
        select 1
        from public.decks descendant
        where descendant.id <> deck.id
          and (descendant.source_deck_id = deck.id or descendant.root_deck_id = deck.id)
      )
      and not exists (
        select 1
        from public.decks descendant
        join public.deck_releases source_release
          on source_release.id = descendant.source_release_id
        where descendant.id <> deck.id
          and source_release.deck_id = deck.id
      )
      and not exists (
        select 1
        from public.deck_releases derived_release
        join public.deck_releases source_release
          on source_release.id = derived_release.derived_from_release_id
        where derived_release.deck_id <> deck.id
          and source_release.deck_id = deck.id
      )
  )
$$;

revoke all on function private.deck_can_be_purged(integer) from public, anon, authenticated;

-- This function was installed by migration 0015. It deletes follow/progress,
-- releases, draft content, and finally the eligible tombstone in one transaction.
select private.purge_unfollowed_deck_tombstones();

commit;
