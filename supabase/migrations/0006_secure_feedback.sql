begin;

-- Feedback can contain contact details and free-form user content. It is written
-- only through the validated server action, whose database role bypasses RLS.
-- Supabase API roles should have no direct access to this table.
alter table public.feedback enable row level security;

drop policy if exists "authenticated users can submit feedback" on public.feedback;

revoke all privileges on table public.feedback from anon, authenticated;
revoke all privileges on sequence public.feedback_id_seq from anon, authenticated;

comment on table public.feedback is
  'Private user feedback. Access is restricted to trusted server-side database roles.';

commit;
