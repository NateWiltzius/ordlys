import type { EmailOtpType } from '@supabase/supabase-js';
import { safeInternalRedirect } from '../redirect';

const CONFIRMATION_OTP_TYPES = new Set<EmailOtpType>(['email', 'signup']);

export function buildEmailConfirmationRedirect(origin: string, nextPath: string): string {
  const url = new URL('/auth/confirm', origin);
  url.searchParams.set('next', safeInternalRedirect(nextPath));
  return url.toString();
}

export function getEmailConfirmationType(value: string | null): EmailOtpType | null {
  if (!value || !CONFIRMATION_OTP_TYPES.has(value as EmailOtpType)) return null;
  return value as EmailOtpType;
}

export function getEmailConfirmationDestination(origin: string, nextPath: string | null): URL {
  return new URL(safeInternalRedirect(nextPath ?? undefined), origin);
}
