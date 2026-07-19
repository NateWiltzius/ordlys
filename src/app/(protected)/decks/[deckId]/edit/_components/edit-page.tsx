'use client';

import LessonCard from '@/app/(protected)/decks/[deckId]/edit/_components/lesson-card';
import CreateLessonModal from '@/app/(protected)/decks/[deckId]/edit/_components/create-lesson-modal';
import PageHeader from '@/components/shared/layout/page-header';
import { EditLessonSummary } from '@/types/lesson.types';
import { Accordion, Card, Tabs } from '@heroui/react';
import EmptyState from '@/components/shared/empty-state';
import { moveLessonAction } from '@/server/lesson.actions';
import { moveItem } from '@/lib/order/move-item';
import { OrderDirection } from '@/types/order.types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import EditDeckModal from './edit-deck-modal';
import { Deck } from '@/types/deck.types';
import type { DeckRelease } from '@/types/deck-release.types';
import PublicationPanel from './publication-panel';
import type { DeckProvenance } from '@/db/queries/deck-release.queries';
import type { RemovedDraftItem } from '@/db/queries/deck-release.queries';
import RemovedDraftItems from './removed-draft-items';
import StatusAlert from '@/components/shared/status-alert';
import { isActionFailure } from '@/lib/action-result';
import ButtonLink from '@/components/shared/button-link';
import type { DeckEditorTab } from '@/lib/deck-editor-tabs';

type Props = {
  lessons: EditLessonSummary[];
  parsedDeckId: number;
  deck: Deck;
  releases: DeckRelease[];
  hasUnpublishedChanges: boolean;
  provenance: DeckProvenance | null;
  removedDraftItems: RemovedDraftItem[];
  initialTab: DeckEditorTab;
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
}: Props) {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<DeckEditorTab>(initialTab);
  const [orderedLessons, setOrderedLessons] = useState(lessons);
  const [lessonCardCounts, setLessonCardCounts] = useState<Record<number, number>>(() =>
    Object.fromEntries(lessons.map(lesson => [lesson.id, lesson.vocabCount])),
  );
  const [expandedLessonKeys, setExpandedLessonKeys] = useState<Set<string | number>>(new Set());
  const [movingLessonId, setMovingLessonId] = useState<number | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  useEffect(() => {
    setOrderedLessons(lessons);
    setLessonCardCounts(Object.fromEntries(lessons.map(lesson => [lesson.id, lesson.vocabCount])));
  }, [lessons]);

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
      router.refresh();
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
        actions={
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={`/decks/${parsedDeckId}`} variant="tertiary">
              Back to deck
            </ButtonLink>
            <EditDeckModal deck={deck} />
          </div>
        }
      />

      <Tabs className="w-full" selectedKey={selectedTab} onSelectionChange={handleTabChange}>
        <Tabs.ListContainer className="w-full">
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

          <Card>
            <Card.Header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Card.Title render={props => <h2 {...props} />}>Lessons</Card.Title>
                <Card.Description>Group vocabulary into focused study sections.</Card.Description>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                <p className="text-sm text-default-500">
                  {orderedLessons.length} {orderedLessons.length === 1 ? 'lesson' : 'lessons'} ·{' '}
                  {totalCardCount} {totalCardCount === 1 ? 'card' : 'cards'}
                </p>
                <CreateLessonModal deckId={parsedDeckId} />
              </div>
            </Card.Header>

            <Card.Content>
              {orderedLessons.length === 0 ? (
                <EmptyState
                  title="No lessons yet"
                  description="Create your first lesson to start adding vocabulary."
                  action={<CreateLessonModal deckId={parsedDeckId} />}
                />
              ) : (
                <Accordion
                  expandedKeys={expandedLessonKeys}
                  onExpandedChange={keys => setExpandedLessonKeys(new Set(keys))}
                >
                  {orderedLessons.map((lesson, index) => (
                    <LessonCard
                      key={lesson.id}
                      deckId={parsedDeckId}
                      lesson={lesson}
                      canMoveUp={index > 0}
                      canMoveDown={index < orderedLessons.length - 1}
                      isLessonOrderPending={movingLessonId !== null}
                      onMoveLesson={handleMoveLesson}
                      isExpanded={expandedLessonKeys.has(String(lesson.id))}
                      onCardCountChange={handleLessonCardCountChange}
                    />
                  ))}
                </Accordion>
              )}
            </Card.Content>
          </Card>

          <RemovedDraftItems items={removedDraftItems} />
        </Tabs.Panel>

        <Tabs.Panel className="pt-4" id="publishing">
          <PublicationPanel
            deck={deck}
            releases={releases}
            hasUnpublishedChanges={hasUnpublishedChanges}
            provenance={provenance}
          />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
