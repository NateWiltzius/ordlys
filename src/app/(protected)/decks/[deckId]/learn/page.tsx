import LearnPage from '@/app/(protected)/decks/[deckId]/learn/_components/learn-page';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { notFound } from 'next/navigation';
import { getLearnPageData } from '@/server/data/review-page-data';
import type { Metadata } from 'next';
import { LEARN_SESSION_SIZE_COOKIE, parseLearnSessionSize } from '@/lib/study-session-size';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'Learn',
  description: 'Learn new cards and add them to your review queue.',
};

type Props = {
  params: Promise<{
    deckId: string;
  }>;
  searchParams: Promise<{ size?: string | string[]; lesson?: string | string[] }>;
};

export default async function Page({ params, searchParams }: Props) {
  const { deckId } = await params;
  const query = await searchParams;
  const lessonId =
    typeof query.lesson === 'string' ? parsePositiveInteger(query.lesson) : undefined;
  if (query.lesson !== undefined && !lessonId) notFound();
  const selectedSize = parseLearnSessionSize(
    query.size,
    (await cookies()).get(LEARN_SESSION_SIZE_COOKIE)?.value,
  );
  const parsedDeckId = parsePositiveInteger(deckId);
  if (!parsedDeckId) notFound();
  const data = await getLearnPageData(parsedDeckId, selectedSize, lessonId ?? undefined);
  if (!data) notFound();
  const { deckTitle, learnItems, lessonProgress, availableCount, dailyProgress } = data;

  return (
    <LearnPage
      key={lessonId ?? 'deck'}
      lessonId={lessonId ?? undefined}
      deckId={parsedDeckId}
      deckTitle={deckTitle}
      learnItems={learnItems}
      lessonProgress={lessonProgress}
      selectedSize={selectedSize}
      availableCount={availableCount}
      dailyProgress={dailyProgress}
    />
  );
}
