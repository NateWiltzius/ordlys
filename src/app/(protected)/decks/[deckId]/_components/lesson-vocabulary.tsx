'use client';

import VocabTable from '@/app/(protected)/decks/[deckId]/_components/vocab/vocab-table';
import { getLessonVocabulary } from '@/lib/client/vocabulary-api';
import { Vocab } from '@/types/vocab.types';
import { Button } from '@heroui/react';
import { useCallback, useEffect, useState } from 'react';
import StatusAlert from '@/components/shared/status-alert';

type SrsState = {
  srsLevel: number;
  dueAt: string;
};

type Props = {
  deckId: number;
  lessonId: number;
  isExpanded: boolean;
  frontLabel: string;
  backLabel: string;
};

export default function LessonVocabulary({
  deckId,
  lessonId,
  isExpanded,
  frontLabel,
  backLabel,
}: Props) {
  const [vocabs, setVocabs] = useState<Vocab[] | null>(null);
  const [srsStates, setSrsStates] = useState<Record<number, SrsState>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadVocabulary = useCallback(async () => {
    if (isLoading || vocabs) return;

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await getLessonVocabulary(deckId, lessonId);
      setVocabs(result.vocabs);
      setSrsStates(result.srsStates);
    } catch {
      setErrorMessage('Unable to load this lesson’s cards. Please try again.');
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
        emptyTitle="No cards in this lesson"
        srsStates={srsStates}
        showSrsLevels
        frontLabel={frontLabel}
        backLabel={backLabel}
      />
    );
  }

  return (
    <div className="rounded-lg bg-default-100 px-4 py-5 text-center">
      {!errorMessage ? <p className="text-sm text-muted">Loading cards...</p> : null}
      {errorMessage ? <StatusAlert status="danger">{errorMessage}</StatusAlert> : null}
      {errorMessage ? (
        <Button size="sm" variant="secondary" className="mt-3" onPress={loadVocabulary}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
