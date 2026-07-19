import { getCurrentUserIdOrNull } from '@/lib/auth/get-current-user-id';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const userId = await getCurrentUserIdOrNull();
  const response = NextResponse.json({ loggedIn: userId !== null });
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
