import {
  getEmailConfirmationDestination,
  getEmailConfirmationType,
} from '@/lib/auth/email-confirmation';
import { createClient } from '@/lib/supabase/server';
import { type NextRequest, NextResponse } from 'next/server';

function confirmationFailureRedirect(request: NextRequest, nextPath: string | null) {
  const destination = getEmailConfirmationDestination(request.nextUrl.origin, nextPath);
  const signInUrl = new URL('/auth/sign-in', request.nextUrl.origin);
  signInUrl.searchParams.set(
    'next',
    `${destination.pathname}${destination.search}${destination.hash}`,
  );
  signInUrl.searchParams.set('error', 'confirmation_failed');
  return NextResponse.redirect(signInUrl);
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get('token_hash');
  const type = getEmailConfirmationType(request.nextUrl.searchParams.get('type'));
  const code = request.nextUrl.searchParams.get('code');
  const nextPath = request.nextUrl.searchParams.get('next');
  const supabase = await createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      return NextResponse.redirect(
        getEmailConfirmationDestination(request.nextUrl.origin, nextPath),
      );
    }
  } else if (code) {
    // Supports Supabase's default PKCE confirmation link during the template migration.
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(
        getEmailConfirmationDestination(request.nextUrl.origin, nextPath),
      );
    }
  }

  return confirmationFailureRedirect(request, nextPath);
}
