import { updateSession } from '@/lib/supabase/proxy';
import { type NextRequest } from 'next/server';
import { getSupabasePublicConfig } from '@/config/supabase';
import { buildContentSecurityPolicy } from '@/lib/security/content-security-policy';

export async function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const policy = buildContentSecurityPolicy({
    nonce,
    supabaseUrl: getSupabasePublicConfig().url,
    isProduction: process.env.NODE_ENV === 'production',
  });
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', policy);

  const response = await updateSession(request, requestHeaders);
  response.headers.set('Content-Security-Policy', policy);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
