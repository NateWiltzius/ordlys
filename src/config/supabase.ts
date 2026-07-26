import { getPublicEnvironment } from '@/config/public-env';

export function getSupabasePublicConfig() {
  const { supabaseUrl: url, supabasePublishableKey: publishableKey } = getPublicEnvironment();
  return { url, publishableKey };
}
