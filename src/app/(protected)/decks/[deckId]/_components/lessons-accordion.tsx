'use client';

import { useDeckTabs } from '@/app/(protected)/decks/[deckId]/_components/deck-tabs';
import LessonVocabulary from '@/app/(protected)/decks/[deckId]/_components/lesson-vocabulary';
import VocabularySearchField from '@/app/(protected)/decks/[deckId]/_components/vocab/vocabulary-search-field';
import VocabTable from '@/app/(protected)/decks/[deckId]/_components/vocab/vocab-table';
import ButtonLink from '@/components/shared/button-link';
import EmptyState from '@/components/shared/empty-state';
import StatusAlert from '@/components/shared/status-alert';
import { filterVocabulary } from '@/lib/vocab/search-vocabulary';
import { getDeckVocabularyForSearch } from '@/lib/client/vocabulary-api';
import { getLessonUnlockMessage } from '@/lib/deck-study-guidance';
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
  const { expandedKeys, setExpandedKeys } = useDeckTabs();
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
      const result = await getDeckVocabularyForSearch(deckId);
      setSearchVocabs(result.vocabs);
      setSearchSrsStates(result.srsStates);
    } catch {
      setSearchError('Unable to search this deck’s cards. Please try again.');
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
          title="No cards match your search"
          description="Try different front or back text, a reading, or a tag."
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
          {lessons.map((lesson, lessonIndex) => {
            const lessonKey = String(lesson.lessonId);
            const isExpanded = expandedKeys.has(lessonKey);
            const unlockMessage = canStudy ? getLessonUnlockMessage(lessons, lessonIndex) : null;

            return (
              <Accordion.Item
                key={lesson.lessonId}
                id={lessonKey}
                className="overflow-hidden rounded-lg"
              >
                <Accordion.Heading>
                  <Accordion.Trigger className="px-3 py-3">
                    <span className="flex min-w-0 flex-1 flex-col items-start gap-2 pr-2 text-left sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <span className="min-w-0 break-words">
                        <span className="block font-medium text-foreground">
                          {lesson.lessonTitle}
                        </span>
                        <span className="mt-1 block text-sm font-normal text-default-500">
                          {lesson.totalWords} {lesson.totalWords === 1 ? 'card' : 'cards'}
                        </span>
                      </span>
                      {lesson.totalWords === 0 ? (
                        <Chip size="sm" variant="soft" className="shrink-0">
                          Empty
                        </Chip>
                      ) : !canStudy ? null : lesson.isUnlocked ? (
                        <Chip size="sm" variant="soft" color="success" className="shrink-0">
                          {lesson.introducedWords >= lesson.totalWords
                            ? 'All cards started'
                            : lesson.introducedWords > 0
                              ? 'In progress'
                              : 'Available'}
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
                    {unlockMessage ? (
                      <p className="mb-4 text-sm leading-6 text-default-500">{unlockMessage}</p>
                    ) : null}
                    {canStudy && lesson.isUnlocked && lesson.totalWords > 0 ? (
                      <p className="mb-4 text-sm text-default-500">
                        {lesson.introducedWords} of {lesson.totalWords} cards introduced &middot;{' '}
                        {Math.min(lesson.learnedWords, lesson.requiredWords)} of{' '}
                        {lesson.requiredWords} cards strengthened toward the lesson milestone
                      </p>
                    ) : null}
                    {canStudy && lesson.canTakePlacementTest ? (
                      <div className="mb-4 flex flex-col items-end gap-2">
                        <p className="max-w-md text-right text-sm text-default-500">
                          Already know these cards? Test their required directions to place familiar
                          cards directly into review.
                        </p>
                        <ButtonLink
                          href={`/decks/${deckId}/placement/${lesson.lessonId}`}
                          variant="secondary"
                          size="sm"
                        >
                          Test out of this lesson
                        </ButtonLink>
                      </div>
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
