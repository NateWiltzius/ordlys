import LearnPage from '@/app/(protected)/decks/[deckId]/learn/_components/learn-page';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { notFound } from 'next/navigation';
import { getLearnPageDataAction } from '@/server/review.actions';
import type { Metadata } from 'next';
import {
  DEFAULT_LEARN_SESSION_SIZE,
  LEARN_SESSION_SIZES,
  parseSessionSize,
} from '@/lib/study-session-size';

export const metadata: Metadata = {
  title: 'Learn',
  description: 'Learn new vocabulary and add it to your review queue.',
};

type Props = {
  params: Promise<{
    deckId: string;
  }>;
  searchParams: Promise<{ size?: string | string[] }>;
};

export default async function Page({ params, searchParams }: Props) {
  const { deckId } = await params;
  const selectedSize = parseSessionSize(
    (await searchParams).size,
    LEARN_SESSION_SIZES,
    DEFAULT_LEARN_SESSION_SIZE,
    true,
  );
  const parsedDeckId = parsePositiveInteger(deckId);
  if (!parsedDeckId) notFound();
  const data = await getLearnPageDataAction(parsedDeckId, selectedSize);
  if (!data) notFound();
  const { learnItems, lessonProgress, availableCount } = data;

  return (
    <LearnPage
      deckId={parsedDeckId}
      learnItems={learnItems}
      lessonProgress={lessonProgress}
      selectedSize={selectedSize}
      availableCount={availableCount}
    />
  );
}
