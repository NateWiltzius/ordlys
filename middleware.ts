import { updateSession } from '@/lib/supabase/proxy';
import { type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    '/account/:path*',
    '/dashboard/:path*',
    '/decks/:path*',
    '/discover/:path*',
    '/practice/:path*',
    '/review/:path*',
  ],
};
