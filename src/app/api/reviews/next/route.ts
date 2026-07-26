import { getCurrentUserIdOrNull } from '@/lib/auth/get-current-user-id';
import { getNextReviewBatchData } from '@/server/data/review-page-data';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  if (!(await getCurrentUserIdOrNull())) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  const deckIdValue = request.nextUrl.searchParams.get('deckId');

  try {
    const nextReview = await getNextReviewBatchData(
      deckIdValue === null ? undefined : Number(deckIdValue),
    );
    return NextResponse.json(nextReview, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch {
    return NextResponse.json({ message: 'Unable to load review schedule.' }, { status: 400 });
  }
}
