'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { deleteAccountData } from '@/db/queries/account.queries';
import { getCurrentUserId } from '@/lib/auth/get-current-user-id';
import { revalidateTag } from 'next/cache';
import { PUBLIC_DECK_SUMMARIES_CACHE_TAG } from '@/lib/cache-tags';

export async function signOutAction() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw new Error('Could not sign out.');
}

export async function deleteAccountAction(confirmation: string) {
  if (confirmation !== 'DELETE') {
    throw new Error('Type DELETE to confirm account deletion.');
  }

  const userId = await getCurrentUserId();
  const admin = createAdminClient();

  // Commit database cleanup before crossing the database/Auth API boundary. If Auth
  // deletion fails, the cleanup is idempotent and the signed-in user can retry.
  await deleteAccountData(userId);
  revalidateTag(PUBLIC_DECK_SUMMARIES_CACHE_TAG);

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error('Account data was removed, but sign-in deletion must be retried.');

  const supabase = await createClient();
  await supabase.auth.signOut({ scope: 'local' });
}
