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

export async function isCurrentAccountVerified(): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return false;
  return Boolean(data.user.email_confirmed_at || data.user.phone_confirmed_at);
}

export async function currentUserCanModerate(): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return false;
  const role = data.user.app_metadata?.role;
  return role === 'moderator' || role === 'admin';
}
