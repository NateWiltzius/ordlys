'use client';

import LessonEditor from '@/app/(protected)/decks/[deckId]/edit/_components/lesson-card';
import CreateLessonModal from '@/app/(protected)/decks/[deckId]/edit/_components/create-lesson-modal';
import PageHeader from '@/components/shared/layout/page-header';
import PageSection from '@/components/shared/layout/page-section';
import EmptyState from '@/components/shared/empty-state';
import StatusAlert from '@/components/shared/status-alert';
import { moveLessonAction } from '@/server/lesson.actions';
import { moveItem } from '@/lib/order/move-item';
import { isActionFailure } from '@/lib/action-result';
import type { EditLessonSummary } from '@/types/lesson.types';
import type { OrderDirection } from '@/types/order.types';
import type { Deck } from '@/types/deck.types';
import type { DeckRelease } from '@/types/deck-release.types';
import type { DeckEditorTab } from '@/lib/deck-editor-tabs';
import { getLanguageName } from '@/lib/languages';
import type { DeckProvenance, RemovedDraftItem } from '@/db/queries/deck-release.queries';
import { Label, ListBox, Select, Tabs } from '@heroui/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import EditDeckModal from './edit-deck-modal';
import PublicationPanel from './publication-panel';
import RemovedDraftItems from './removed-draft-items';
import EditableVocabularySearch from './editable-vocabulary-search';

type Props = {
  lessons: EditLessonSummary[];
  parsedDeckId: number;
  deck: Deck;
  releases: DeckRelease[];
  hasUnpublishedChanges: boolean;
  provenance: DeckProvenance | null;
  removedDraftItems: RemovedDraftItem[];
  initialTab: DeckEditorTab;
  initialSelectedLessonId: number | null;
};

export default function EditPage({
  lessons,
  parsedDeckId,
  deck,
  releases,
  hasUnpublishedChanges,
  provenance,
  removedDraftItems,
  initialTab,
  initialSelectedLessonId,
}: Props) {
  const [selectedTab, setSelectedTab] = useState<DeckEditorTab>(initialTab);
  const [orderedLessons, setOrderedLessons] = useState(lessons);
  const [selectedLessonId, setSelectedLessonId] = useState(initialSelectedLessonId);
  const [lessonCardCounts, setLessonCardCounts] = useState<Record<number, number>>(() =>
    Object.fromEntries(lessons.map(lesson => [lesson.id, lesson.vocabCount])),
  );
  const [movingLessonId, setMovingLessonId] = useState<number | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [vocabularyQuery, setVocabularyQuery] = useState('');
  const [focusedVocabId, setFocusedVocabId] = useState<number | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('open')) return;

    url.searchParams.delete('open');
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }, []);

  const totalCardCount = useMemo(
    () =>
      orderedLessons.reduce(
        (total, lesson) => total + (lessonCardCounts[lesson.id] ?? lesson.vocabCount),
        0,
      ),
    [lessonCardCounts, orderedLessons],
  );

  const handleLessonCardCountChange = useCallback((lessonId: number, cardCount: number) => {
    setLessonCardCounts(current =>
      current[lessonId] === cardCount ? current : { ...current, [lessonId]: cardCount },
    );
  }, []);

  const handleSelectLesson = (lessonId: number) => {
    setSelectedLessonId(lessonId);
    setFocusedVocabId(null);
    const url = new URL(window.location.href);
    url.searchParams.set('lesson', String(lessonId));
    url.searchParams.delete('open');
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  };

  const handleOpenLesson = (lessonId: number) => {
    setVocabularyQuery('');
    handleSelectLesson(lessonId);
  };

  const handleOpenCard = (lessonId: number, vocabId: number) => {
    setVocabularyQuery('');
    handleSelectLesson(lessonId);
    setFocusedVocabId(vocabId);
  };

  const handleMoveLesson = async (lessonId: number, direction: OrderDirection) => {
    if (movingLessonId !== null) return;

    const previousLessons = orderedLessons;
    const currentIndex = previousLessons.findIndex(lesson => lesson.id === lessonId);
    const nextLessons = moveItem(previousLessons, currentIndex, direction);
    if (nextLessons === previousLessons) return;

    setOrderedLessons(nextLessons);
    setMovingLessonId(lessonId);
    setMutationError(null);

    try {
      const result = await moveLessonAction(lessonId, direction);
      if (isActionFailure(result)) {
        setOrderedLessons(previousLessons);
        setMutationError(result.message);
        return;
      }
    } catch {
      setOrderedLessons(previousLessons);
    } finally {
      setMovingLessonId(null);
    }
  };

  const handleTabChange = (key: string | number | null) => {
    if (key !== 'content' && key !== 'publishing') return;

    setSelectedTab(key);
    const url = new URL(window.location.href);
    if (key === 'publishing') url.searchParams.set('tab', 'publishing');
    else url.searchParams.delete('tab');
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={deck.title}
        description="Edit this deck's content, details, and publishing settings."
        backLink={{ href: `/decks/${parsedDeckId}`, label: 'Back to deck' }}
        actions={<EditDeckModal deck={deck} />}
      />

      <Tabs className="w-full" selectedKey={selectedTab} onSelectionChange={handleTabChange}>
        <Tabs.ListContainer className="w-full sm:max-w-md">
          <Tabs.List aria-label="Deck management sections" className="grid w-full grid-cols-2">
            <Tabs.Tab id="content" className="w-full justify-center">
              Content
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="publishing" className="w-full justify-center">
              Publishing
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel className="space-y-6 pt-4" id="content">
          {mutationError ? <StatusAlert status="danger">{mutationError}</StatusAlert> : null}

          <PageSection
            title="Lessons"
            description="Search the deck or select a lesson to edit its cards."
            contentClassName="space-y-4"
            action={
              <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                <p className="text-sm text-default-500">
                  {orderedLessons.length} {orderedLessons.length === 1 ? 'lesson' : 'lessons'} ·{' '}
                  {totalCardCount} {totalCardCount === 1 ? 'card' : 'cards'}
                </p>
                <CreateLessonModal deckId={parsedDeckId} onCreated={handleOpenLesson} />
              </div>
            }
          >
            {orderedLessons.length === 0 ? (
              <EmptyState
                title="No lessons yet"
                description="Create your first lesson to start adding cards."
                action={<CreateLessonModal deckId={parsedDeckId} onCreated={handleOpenLesson} />}
              />
            ) : (
              <div className="grid items-start gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
                <aside className="hidden overflow-hidden rounded-xl border border-default-200 bg-default-50/40 lg:sticky lg:top-6 lg:block">
                  <div className="border-b border-default-200 px-3 py-3">
                    <p className="text-sm font-semibold text-foreground">Lesson navigator</p>
                    <p className="mt-0.5 text-xs text-muted">Select a lesson to edit its cards.</p>
                  </div>
                  <div className="max-h-[calc(100vh-10rem)] space-y-1 overflow-y-auto p-2">
                    {orderedLessons.map(lesson => {
                      const isActive = selectedLessonId === lesson.id;
                      const cardCount = lessonCardCounts[lesson.id] ?? lesson.vocabCount;

                      return (
                        <button
                          key={lesson.id}
                          type="button"
                          aria-current={isActive ? 'page' : undefined}
                          className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors ${
                            isActive
                              ? 'bg-accent-soft text-accent-soft-foreground'
                              : 'text-default-700 hover:bg-default-100'
                          }`}
                          onClick={() => handleOpenLesson(lesson.id)}
                        >
                          <span className="min-w-0 flex-1 truncate text-sm font-medium">
                            {lesson.title}
                          </span>
                          <span className="shrink-0 text-xs tabular-nums text-muted">
                            {cardCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </aside>

                <div className="min-w-0 space-y-3">
                  <div className="lg:hidden">
                    <Select
                      value={selectedLessonId ? String(selectedLessonId) : null}
                      fullWidth
                      onChange={value => {
                        if (value === null || Array.isArray(value)) return;
                        const lessonId = Number(value);
                        if (Number.isInteger(lessonId)) handleOpenLesson(lessonId);
                      }}
                    >
                      <Label>Lesson</Label>
                      <Select.Trigger className="min-w-0">
                        <Select.Value className="truncate" />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {orderedLessons.map(lesson => (
                            <ListBox.Item
                              key={lesson.id}
                              id={String(lesson.id)}
                              textValue={lesson.title}
                            >
                              <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                                <span className="truncate">{lesson.title}</span>
                                <span className="shrink-0 text-xs text-muted">
                                  {lessonCardCounts[lesson.id] ?? lesson.vocabCount} cards
                                </span>
                              </span>
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>

                  <EditableVocabularySearch
                    deckId={parsedDeckId}
                    lessons={orderedLessons}
                    query={vocabularyQuery}
                    frontLabel={getLanguageName(deck.frontLanguage) ?? 'Front'}
                    backLabel={getLanguageName(deck.backLanguage) ?? 'Back'}
                    onQueryChange={setVocabularyQuery}
                    onSelectLesson={handleOpenLesson}
                    onSelectCard={handleOpenCard}
                  />

                  {vocabularyQuery.trim() ? null : selectedLessonId === null ? (
                    <EmptyState
                      title="No lesson selected"
                      description="Choose a lesson from the navigator to continue editing."
                    />
                  ) : (
                    orderedLessons.map((lesson, lessonIndex) => {
                      const isActive = selectedLessonId === lesson.id;
                      return (
                        <div key={lesson.id} hidden={!isActive}>
                          <LessonEditor
                            deckId={parsedDeckId}
                            lesson={lesson}
                            lessonPosition={lessonIndex + 1}
                            lessonTotal={orderedLessons.length}
                            canMoveUp={lessonIndex > 0}
                            canMoveDown={lessonIndex < orderedLessons.length - 1}
                            isLessonOrderPending={movingLessonId !== null}
                            onMoveLesson={handleMoveLesson}
                            isActive={isActive}
                            onCardCountChange={handleLessonCardCountChange}
                            focusedVocabId={isActive ? focusedVocabId : null}
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </PageSection>

          <RemovedDraftItems items={removedDraftItems} />
        </Tabs.Panel>

        <Tabs.Panel className="pt-4" id="publishing">
          <PublicationPanel
            deck={deck}
            releases={releases}
            hasUnpublishedChanges={hasUnpublishedChanges}
            provenance={provenance}
            lessonCount={orderedLessons.length}
            cardCount={totalCardCount}
          />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
