import EditPage from '@/app/(protected)/decks/[deckId]/edit/_components/edit-page';
import { Vocab } from '@/types/vocab.types';
import { getOwnedDeckById } from '@/db/queries/deck.queries';
import { getLessonsByDeckId } from '@/db/queries/lesson.queries';
import { getVocabByDeckId } from '@/db/queries/vocab.queries';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { notFound } from 'next/navigation';
import { getCurrentUserId } from '@/lib/auth/get-current-user-id';

type Props = {
  params: Promise<{
    deckId: string;
  }>;
};

export default async function Page({ params }: Props) {
  const { deckId } = await params;
  const parsedDeckId = parsePositiveInteger(deckId);
  if (!parsedDeckId) notFound();

  const userId = await getCurrentUserId();
  const deck = await getOwnedDeckById(parsedDeckId, userId);
  if (!deck) notFound();

  const [lessons, vocabs] = await Promise.all([
    getLessonsByDeckId(parsedDeckId),
    getVocabByDeckId(parsedDeckId),
  ]);

  const lessonVocabs = vocabs.reduce<Record<number, Vocab[]>>((accumulator, vocab) => {
    accumulator[vocab.lessonId] ??= [];
    accumulator[vocab.lessonId].push(vocab);
    return accumulator;
  }, {});

  return <EditPage lessons={lessons} lessonVocabs={lessonVocabs} parsedDeckId={parsedDeckId} />;
}
