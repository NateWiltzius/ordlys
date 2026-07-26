import { createClient } from '@supabase/supabase-js';
import { getSupabaseSecretKey } from '@/config/server-env';
import { getPublicEnvironment } from '@/config/public-env';

export function createAdminClient() {
  const { supabaseUrl: url } = getPublicEnvironment();
  const secretKey = getSupabaseSecretKey();

  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
