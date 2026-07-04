import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';

export const getCurrentUserIdOrNull = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (error || typeof userId !== 'string') return null;

  return userId;
});

export async function getCurrentUserId(): Promise<string> {
  const userId = await getCurrentUserIdOrNull();
  if (!userId) throw new Error('User not authenticated');

  return userId;
}
