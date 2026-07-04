'use client';

import VocabTable from '@/app/(protected)/decks/[deckId]/_components/vocab/vocab-table';
import { getLessonVocabularyAction } from '@/server/vocab.actions';
import { Vocab } from '@/types/vocab.types';
import { Button } from '@heroui/react';
import { useCallback, useEffect, useState } from 'react';

type Props = {
  deckId: number;
  lessonId: number;
  isExpanded: boolean;
};

export default function LessonVocabulary({ deckId, lessonId, isExpanded }: Props) {
  const [vocabs, setVocabs] = useState<Vocab[] | null>(null);
  const [srsLevels, setSrsLevels] = useState<Record<number, number>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadVocabulary = useCallback(async () => {
    if (isLoading || vocabs) return;

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await getLessonVocabularyAction(deckId, lessonId);
      setVocabs(result.vocabs);
      setSrsLevels(result.srsLevels);
    } catch {
      setErrorMessage('Unable to load this lesson’s vocabulary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [deckId, isLoading, lessonId, vocabs]);

  useEffect(() => {
    if (isExpanded && !vocabs && !isLoading && !errorMessage) {
      void loadVocabulary();
    }
  }, [errorMessage, isExpanded, isLoading, loadVocabulary, vocabs]);

  if (vocabs) {
    return (
      <VocabTable
        vocabs={vocabs}
        emptyTitle="No vocabulary in this lesson"
        srsLevels={srsLevels}
        showSrsLevels
      />
    );
  }

  return (
    <div className="rounded-lg bg-default-100 px-4 py-5 text-center">
      {!errorMessage ? <p className="text-sm text-default-500">Loading vocabulary...</p> : null}
      {errorMessage ? (
        <p role="alert" className="text-sm text-danger">
          {errorMessage}
        </p>
      ) : null}
      {errorMessage ? (
        <Button size="sm" variant="secondary" className="mt-3" onPress={loadVocabulary}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
