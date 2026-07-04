import EditPage from '@/app/(protected)/decks/[deckId]/edit/edit-page';
import { getLessonsAction } from '@/server/lesson.actions';
import { getVocabsByDeckAction } from '@/server/vocab.actions';
import { Vocab } from '@/types/vocab.types';

type Props = {
  params: Promise<{
    deckId: string;
  }>;
};

export default async function Page({ params }: Props) {
  const { deckId } = await params;
  const parsedDeckId = Number(deckId);

  const [lessons, vocabs] = await Promise.all([
    getLessonsAction(parsedDeckId),
    getVocabsByDeckAction(parsedDeckId),
  ]);

  const lessonVocabs = vocabs.reduce<Record<number, Vocab[]>>((accumulator, vocab) => {
    accumulator[vocab.lessonId] ??= [];
    accumulator[vocab.lessonId].push(vocab);
    return accumulator;
  }, {});

  return <EditPage lessons={lessons} lessonVocabs={lessonVocabs} parsedDeckId={parsedDeckId} />;
}
