import { getCurrentUserIdOrNull } from '@/lib/auth/get-current-user-id';
import { serializeVocab } from '@/lib/vocab/vocab-transport';
import {
  getDeckVocabularyForSearchData,
  getLessonVocabularyData,
} from '@/server/data/vocabulary-data';
import { NextRequest, NextResponse } from 'next/server';

type Context = {
  params: Promise<{ deckId: string }>;
};

export async function GET(request: NextRequest, { params }: Context) {
  if (!(await getCurrentUserIdOrNull())) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  const deckId = Number((await params).deckId);
  const lessonIdValue = request.nextUrl.searchParams.get('lessonId');

  try {
    const data =
      lessonIdValue === null
        ? await getDeckVocabularyForSearchData(deckId)
        : await getLessonVocabularyData(deckId, Number(lessonIdValue));

    return NextResponse.json(
      { ...data, vocabs: data.vocabs.map(serializeVocab) },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch {
    return NextResponse.json({ message: 'Unable to load vocabulary.' }, { status: 400 });
  }
}
