'use client';

import VocabTable from '@/app/(protected)/decks/[deckId]/_components/vocab/vocab-table';
import VocabularySearchField from '@/app/(protected)/decks/[deckId]/_components/vocab/vocabulary-search-field';
import EditVocabModal from '@/app/(protected)/decks/[deckId]/edit/_components/edit-vocab-modal';
import EmptyState from '@/components/shared/empty-state';
import StatusAlert from '@/components/shared/status-alert';
import { filterVocabulary } from '@/lib/vocab/search-vocabulary';
import { getEditableDeckVocabularyForSearchAction } from '@/server/vocab.actions';
import type { EditLessonSummary } from '@/types/lesson.types';
import type { Vocab } from '@/types/vocab.types';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { Button } from '@heroui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

type Props = {
  deckId: number;
  lessons: EditLessonSummary[];
  query: string;
  frontLabel: string;
  backLabel: string;
  onQueryChange: (query: string) => void;
};

export default function EditableVocabularySearch({
  deckId,
  lessons,
  query,
  frontLabel,
  backLabel,
  onQueryChange,
}: Props) {
  const [vocabs, setVocabs] = useState<Vocab[] | null>(null);
  const [selectedVocab, setSelectedVocab] = useState<Vocab | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasQuery = query.trim().length > 0;

  const loadVocabulary = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      setVocabs(await getEditableDeckVocabularyForSearchAction(deckId));
    } catch {
      setError('Unable to search this deck’s cards. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [deckId, isLoading]);

  useEffect(() => {
    if (hasQuery && vocabs === null && !isLoading && !error) void loadVocabulary();
  }, [error, hasQuery, isLoading, loadVocabulary, vocabs]);

  const matches = useMemo(() => (vocabs ? filterVocabulary(vocabs, query) : []), [query, vocabs]);
  const matchesByLesson = useMemo(() => {
    const grouped = new Map<number, Vocab[]>();
    for (const vocab of matches) {
      const lessonVocabs = grouped.get(vocab.lessonId) ?? [];
      lessonVocabs.push(vocab);
      grouped.set(vocab.lessonId, lessonVocabs);
    }
    return grouped;
  }, [matches]);

  const handleQueryChange = (nextQuery: string) => {
    if (!nextQuery.trim()) {
      setVocabs(null);
      setError(null);
    }
    onQueryChange(nextQuery);
  };

  return (
    <div className="space-y-4">
      <VocabularySearchField
        id={`deck-${deckId}-editable-vocabulary-search`}
        query={query}
        resultCount={hasQuery && vocabs ? matches.length : null}
        isLoading={isLoading}
        onQueryChange={handleQueryChange}
      />

      {error && hasQuery ? (
        <div className="space-y-3">
          <StatusAlert status="danger">{error}</StatusAlert>
          <Button size="sm" variant="secondary" onPress={loadVocabulary}>
            Try again
          </Button>
        </div>
      ) : null}

      {hasQuery && vocabs && matches.length === 0 ? (
        <EmptyState
          title="No cards match your search"
          description="Try different front or back text, a reading, or a tag."
        />
      ) : null}

      {hasQuery && vocabs && matches.length > 0 ? (
        <div className="space-y-4">
          {lessons.map(lesson => {
            const lessonMatches = matchesByLesson.get(lesson.id);
            if (!lessonMatches?.length) return null;

            return (
              <section key={lesson.id} className="space-y-2.5">
                <div className="flex items-baseline justify-between gap-3 px-1">
                  <h3 className="text-sm font-semibold text-foreground">{lesson.title}</h3>
                  <span className="shrink-0 text-xs text-muted">
                    {lessonMatches.length} {lessonMatches.length === 1 ? 'match' : 'matches'}
                  </span>
                </div>
                <VocabTable
                  vocabs={lessonMatches}
                  frontLabel={frontLabel}
                  backLabel={backLabel}
                  renderActions={vocab => (
                    <Button
                      size="sm"
                      variant="tertiary"
                      isIconOnly
                      aria-label={`Edit ${vocab.front}`}
                      onPress={() => setSelectedVocab(vocab)}
                    >
                      <PencilSquareIcon className="size-4" aria-hidden="true" />
                    </Button>
                  )}
                />
              </section>
            );
          })}
        </div>
      ) : null}

      <EditVocabModal
        vocab={selectedVocab}
        isOpen={selectedVocab !== null}
        onOpenChange={isOpen => {
          if (!isOpen) setSelectedVocab(null);
        }}
        onSaved={loadVocabulary}
      />
    </div>
  );
}
