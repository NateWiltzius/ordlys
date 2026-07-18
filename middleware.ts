import { updateSession } from '@/lib/supabase/proxy';
import { type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
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
