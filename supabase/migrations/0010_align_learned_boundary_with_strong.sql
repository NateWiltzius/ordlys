begin;

-- Placement tests previously stopped at displayed level 3, the final Learning level.
-- Move unreviewed, successfully placed words to displayed level 4, the first Strong level.
with completed_placements as (
  select
    user_id,
    vocab_id,
    max(attempted_at) as completed_at
  from review_attempts
  where mode = 'placement'
    and is_correct = true
    and was_overridden = false
  group by user_id, vocab_id
  having count(distinct direction) = 2
)
update user_vocab_state as state
set
  srs_level = 3,
  updated_at = now()
from completed_placements as placement
where state.user_id = placement.user_id
  and state.vocab_id = placement.vocab_id
  and state.srs_level = 2
  and not exists (
    select 1
    from review_attempts as later_review
    where later_review.user_id = placement.user_id
      and later_review.vocab_id = placement.vocab_id
      and later_review.mode = 'review'
      and later_review.attempted_at > placement.completed_at
  );

commit;
