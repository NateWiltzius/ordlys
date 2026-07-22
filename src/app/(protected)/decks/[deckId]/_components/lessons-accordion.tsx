'use client';

import LessonVocabulary from '@/app/(protected)/decks/[deckId]/_components/lesson-vocabulary';
import VocabularySearchField from '@/app/(protected)/decks/[deckId]/_components/vocab/vocabulary-search-field';
import VocabTable from '@/app/(protected)/decks/[deckId]/_components/vocab/vocab-table';
import ButtonLink from '@/components/shared/button-link';
import EmptyState from '@/components/shared/empty-state';
import StatusAlert from '@/components/shared/status-alert';
import { filterVocabulary } from '@/lib/vocab/search-vocabulary';
import { getDeckVocabularyForSearchAction } from '@/server/vocab.actions';
import { LESSON_PROGRESSION_CONFIG } from '@/lib/srs/srs-config';
import { LessonProgress } from '@/types/review.types';
import type { Vocab } from '@/types/vocab.types';
import { Accordion, Button, Chip } from '@heroui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

type SrsState = {
  srsLevel: number;
  dueAt: string;
};

type Props = {
  deckId: number;
  lessons: LessonProgress[];
  canStudy: boolean;
  frontLabel: string;
  backLabel: string;
};

export default function LessonsAccordion({
  deckId,
  lessons,
  canStudy,
  frontLabel,
  backLabel,
}: Props) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string | number>>(new Set());
  const [query, setQuery] = useState('');
  const [searchVocabs, setSearchVocabs] = useState<Vocab[] | null>(null);
  const [searchSrsStates, setSearchSrsStates] = useState<Record<number, SrsState>>({});
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const hasQuery = query.trim().length > 0;

  const loadSearchVocabulary = useCallback(async () => {
    if (isSearchLoading) return;

    setIsSearchLoading(true);
    setSearchError(null);
    try {
      const result = await getDeckVocabularyForSearchAction(deckId);
      setSearchVocabs(result.vocabs);
      setSearchSrsStates(result.srsStates);
    } catch {
      setSearchError('Unable to search this deck’s vocabulary. Please try again.');
    } finally {
      setIsSearchLoading(false);
    }
  }, [deckId, isSearchLoading]);

  useEffect(() => {
    if (hasQuery && searchVocabs === null && !isSearchLoading && !searchError) {
      void loadSearchVocabulary();
    }
  }, [hasQuery, isSearchLoading, loadSearchVocabulary, searchError, searchVocabs]);

  const matches = useMemo(
    () => (searchVocabs ? filterVocabulary(searchVocabs, query) : []),
    [query, searchVocabs],
  );

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
      setSearchVocabs(null);
      setSearchSrsStates({});
      setSearchError(null);
    }
    setQuery(nextQuery);
  };

  return (
    <div className="space-y-4">
      <VocabularySearchField
        id={`deck-${deckId}-vocabulary-search`}
        query={query}
        resultCount={hasQuery && searchVocabs ? matches.length : null}
        isLoading={isSearchLoading}
        onQueryChange={handleQueryChange}
      />

      {searchError && hasQuery ? (
        <div className="space-y-3">
          <StatusAlert status="danger">{searchError}</StatusAlert>
          <Button size="sm" variant="secondary" onPress={loadSearchVocabulary}>
            Try again
          </Button>
        </div>
      ) : null}

      {hasQuery && searchVocabs && matches.length === 0 ? (
        <EmptyState
          title="No vocabulary matches your search"
          description="Try a different word, meaning, reading, or tag."
        />
      ) : null}

      {hasQuery && searchVocabs && matches.length > 0 ? (
        <div className="space-y-4">
          {lessons.map(lesson => {
            const lessonMatches = matchesByLesson.get(lesson.lessonId);
            if (!lessonMatches?.length) return null;

            return (
              <section key={lesson.lessonId} className="space-y-2.5">
                <div className="flex items-baseline justify-between gap-3 px-1">
                  <h3 className="text-sm font-semibold text-foreground">{lesson.lessonTitle}</h3>
                  <span className="shrink-0 text-xs text-muted">
                    {lessonMatches.length} {lessonMatches.length === 1 ? 'match' : 'matches'}
                  </span>
                </div>
                <VocabTable
                  vocabs={lessonMatches}
                  srsStates={searchSrsStates}
                  showSrsLevels
                  frontLabel={frontLabel}
                  backLabel={backLabel}
                />
              </section>
            );
          })}
        </div>
      ) : null}

      {!hasQuery ? (
        <Accordion
          className="flex flex-col gap-1"
          hideSeparator
          expandedKeys={expandedKeys}
          onExpandedChange={keys => setExpandedKeys(new Set(keys))}
        >
          {lessons.map(lesson => {
            const lessonKey = String(lesson.lessonId);
            const isExpanded = expandedKeys.has(lessonKey);

            return (
              <Accordion.Item
                key={lesson.lessonId}
                id={lessonKey}
                className="overflow-hidden rounded-lg"
              >
                <Accordion.Heading>
                  <Accordion.Trigger className="px-3 py-3">
                    <span className="flex min-w-0 flex-1 flex-col items-start gap-2 pr-2 text-left sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <span className="min-w-0 break-words font-medium text-foreground">
                        {lesson.lessonTitle}
                      </span>
                      {lesson.totalWords === 0 ? (
                        <Chip size="sm" variant="soft" className="shrink-0">
                          Empty
                        </Chip>
                      ) : lesson.isUnlocked ? (
                        <Chip size="sm" variant="soft" color="success" className="shrink-0">
                          {Math.min(lesson.learnedWords, lesson.requiredWords)} of{' '}
                          {lesson.requiredWords} words strengthened
                        </Chip>
                      ) : (
                        <Chip size="sm" variant="soft" className="shrink-0">
                          Locked
                        </Chip>
                      )}
                    </span>
                    <Accordion.Indicator />
                  </Accordion.Trigger>
                </Accordion.Heading>
                <Accordion.Panel>
                  <Accordion.Body className="px-3 pb-4">
                    {canStudy && lesson.canTakePlacementTest ? (
                      <div className="mb-4 flex justify-end">
                        <ButtonLink
                          href={`/decks/${deckId}/placement/${lesson.lessonId}`}
                          variant="secondary"
                          size="sm"
                        >
                          Take placement test
                        </ButtonLink>
                      </div>
                    ) : canStudy && lesson.totalWords > lesson.introducedWords ? (
                      <p className="mb-4 text-right text-sm text-muted">
                        Strengthen at least{' '}
                        {Math.round(LESSON_PROGRESSION_CONFIG.unlockRatio * 100)}% of the previous
                        lesson&apos;s words to unlock this placement test.
                      </p>
                    ) : null}
                    {lesson.totalWords > 0 ? (
                      <LessonVocabulary
                        deckId={deckId}
                        lessonId={lesson.lessonId}
                        isExpanded={isExpanded}
                        frontLabel={frontLabel}
                        backLabel={backLabel}
                      />
                    ) : null}
                  </Accordion.Body>
                </Accordion.Panel>
              </Accordion.Item>
            );
          })}
        </Accordion>
      ) : null}
    </div>
  );
}
