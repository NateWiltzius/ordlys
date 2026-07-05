import EditPage from '@/app/(protected)/decks/[deckId]/edit/_components/edit-page';
import { Vocab } from '@/types/vocab.types';
import { parsePositiveInteger } from '@/lib/validation/parse-positive-integer';
import { notFound } from 'next/navigation';
import { getEditDeckPageDataAction } from '@/server/deck.actions';

type Props = {
  params: Promise<{
    deckId: string;
  }>;
};

export default async function Page({ params }: Props) {
  const { deckId } = await params;
  const parsedDeckId = parsePositiveInteger(deckId);
  if (!parsedDeckId) notFound();

  const data = await getEditDeckPageDataAction(parsedDeckId);
  if (!data) notFound();
  const { deck, lessons, vocabs } = data;

  const lessonVocabs = vocabs.reduce<Record<number, Vocab[]>>((accumulator, vocab) => {
    accumulator[vocab.lessonId] ??= [];
    accumulator[vocab.lessonId].push(vocab);
    return accumulator;
  }, {});

  return (
    <EditPage
      deck={deck}
      lessons={lessons}
      lessonVocabs={lessonVocabs}
      parsedDeckId={parsedDeckId}
    />
  );
}
