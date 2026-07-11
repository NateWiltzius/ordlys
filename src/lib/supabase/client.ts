import { getSupabasePublicConfig } from '@/config/supabase';
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const { url, publishableKey } = getSupabasePublicConfig();
  return createBrowserClient(url, publishableKey);
}
