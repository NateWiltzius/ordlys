import { AUTHENTICATED_USER_ID_HEADER } from '@/lib/auth/auth-headers';
import { getSupabasePublicConfig } from '@/config/supabase';
import { isProtectedAppPath } from '@/lib/protected-routes';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest, requestHeaders = request.headers) {
  const cookiesToSet: { name: string; value: string; options: CookieOptions }[] = [];
  const { url, publishableKey } = getSupabasePublicConfig();
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookieUpdates) {
        for (const cookie of cookieUpdates) {
          request.cookies.set(cookie.name, cookie.value);
          const existingIndex = cookiesToSet.findIndex(({ name }) => name === cookie.name);
          if (existingIndex === -1) cookiesToSet.push(cookie);
          else cookiesToSet[existingIndex] = cookie;
        }
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === 'string' ? data.claims.sub : null;
  const isProtectedPath = isProtectedAppPath(request.nextUrl.pathname);
  const forwardedHeaders = new Headers(requestHeaders);

  // Never forward a client-supplied identity hint. Server code verifies the
  // Supabase claims independently instead of trusting a request header.
  forwardedHeaders.delete(AUTHENTICATED_USER_ID_HEADER);
  if (cookiesToSet.length > 0) forwardedHeaders.set('cookie', request.cookies.toString());

  const applyUpdatedCookies = (response: NextResponse) => {
    for (const { name, value, options } of cookiesToSet) {
      response.cookies.set(name, value, options);
    }
    return response;
  };

  if (userId || !isProtectedPath) {
    return applyUpdatedCookies(NextResponse.next({ request: { headers: forwardedHeaders } }));
  }

  const urlToSignIn = request.nextUrl.clone();
  urlToSignIn.pathname = '/auth/sign-in';
  urlToSignIn.search = '';
  urlToSignIn.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return applyUpdatedCookies(NextResponse.redirect(urlToSignIn));
}
