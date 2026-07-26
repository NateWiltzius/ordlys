import { getSupabasePublicConfig } from '@/config/supabase';
import { isProtectedAppPath } from '@/lib/protected-routes';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest, requestHeaders = request.headers) {
  let response = NextResponse.next({ request: { headers: requestHeaders } });
  const { url, publishableKey } = getSupabasePublicConfig();
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request: { headers: requestHeaders } });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const isProtectedPath = isProtectedAppPath(request.nextUrl.pathname);
  if (data?.claims || !isProtectedPath) return response;

  const urlToSignIn = request.nextUrl.clone();
  urlToSignIn.pathname = '/auth/sign-in';
  urlToSignIn.search = '';
  urlToSignIn.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`);
  const redirect = NextResponse.redirect(urlToSignIn);
  for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
  return redirect;
}
