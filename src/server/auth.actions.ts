'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { deleteAccountData } from '@/db/queries/account.queries';
import { getCurrentUserId } from '@/lib/auth/get-current-user-id';
import { redirect } from 'next/navigation';
import { revalidateTag } from 'next/cache';
import { PUBLIC_DECK_SUMMARIES_CACHE_TAG } from '@/lib/cache-tags';

export async function deleteAccountAction(confirmation: string) {
  if (confirmation !== 'DELETE') {
    throw new Error('Type DELETE to confirm account deletion.');
  }

  const userId = await getCurrentUserId();
  const admin = createAdminClient();

  await deleteAccountData(userId, async () => {
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) throw new Error('Could not delete the authentication account.');
  });
  revalidateTag(PUBLIC_DECK_SUMMARIES_CACHE_TAG);

  const supabase = await createClient();
  await supabase.auth.signOut({ scope: 'local' });
  redirect('/');
}
