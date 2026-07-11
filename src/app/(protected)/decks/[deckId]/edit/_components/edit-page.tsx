'use client';

import LessonCard from '@/app/(protected)/decks/[deckId]/edit/_components/lesson-card';
import CreateLessonModal from '@/app/(protected)/decks/[deckId]/edit/_components/create-lesson-modal';
import PageHeader from '@/components/shared/layout/page-header';
import { EditLessonSummary } from '@/types/lesson.types';
import { Card } from '@heroui/react';
import ButtonLink from '@/components/shared/button-link';
import EmptyState from '@/components/shared/empty-state';
import { moveLessonAction } from '@/server/lesson.actions';
import { moveItem } from '@/lib/order/move-item';
import { OrderDirection } from '@/types/order.types';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import EditDeckModal from './edit-deck-modal';
import { Deck } from '@/types/deck.types';
import type { DeckRelease } from '@/types/deck-release.types';
import PublicationPanel from './publication-panel';
import type { DeckProvenance } from '@/db/queries/deck-release.queries';
import type { RemovedDraftItem } from '@/db/queries/deck-release.queries';
import RemovedDraftItems from './removed-draft-items';

type Props = {
  lessons: EditLessonSummary[];
  parsedDeckId: number;
  deck: Deck;
  releases: DeckRelease[];
  hasUnpublishedChanges: boolean;
  provenance: DeckProvenance | null;
  removedDraftItems: RemovedDraftItem[];
};

export default function EditPage({
  lessons,
  parsedDeckId,
  deck,
  releases,
  hasUnpublishedChanges,
  provenance,
  removedDraftItems,
}: Props) {
  const router = useRouter();
  const [orderedLessons, setOrderedLessons] = useState(lessons);
  const [movingLessonId, setMovingLessonId] = useState<number | null>(null);

  useEffect(() => {
    setOrderedLessons(lessons);
  }, [lessons]);

  const handleMoveLesson = async (lessonId: number, direction: OrderDirection) => {
    if (movingLessonId !== null) return;

    const previousLessons = orderedLessons;
    const currentIndex = previousLessons.findIndex(lesson => lesson.id === lessonId);
    const nextLessons = moveItem(previousLessons, currentIndex, direction);
    if (nextLessons === previousLessons) return;

    setOrderedLessons(nextLessons);
    setMovingLessonId(lessonId);

    try {
      await moveLessonAction(lessonId, direction);
      router.refresh();
    } catch {
      setOrderedLessons(previousLessons);
    } finally {
      setMovingLessonId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit deck"
        description={
          deck.sourceReleaseId
            ? 'This is your independent editable copy. Your changes stay here, and updates from the original author will not be applied.'
            : 'Organize lessons and vocabulary for this deck.'
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={`/decks/${parsedDeckId}`} variant="secondary">
              Back to deck
            </ButtonLink>
            <CreateLessonModal deckId={parsedDeckId} />
            <EditDeckModal deck={deck} />
          </div>
        }
      />

      <PublicationPanel
        deck={deck}
        releases={releases}
        hasUnpublishedChanges={hasUnpublishedChanges}
        provenance={provenance}
      />

      <RemovedDraftItems items={removedDraftItems} />

      <Card>
        <Card.Header className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Card.Title>Lessons</Card.Title>
            <Card.Description>Group vocabulary into focused study sections.</Card.Description>
          </div>

          <p className="text-sm text-default-500">
            {orderedLessons.length} {orderedLessons.length === 1 ? 'lesson' : 'lessons'}
          </p>
        </Card.Header>

        <Card.Content>
          {orderedLessons.length === 0 ? (
            <EmptyState
              title="No lessons yet"
              description="Create your first lesson to start adding vocabulary."
              action={<CreateLessonModal deckId={parsedDeckId} />}
            />
          ) : (
            <div className="space-y-3">
              {orderedLessons.map((lesson, index) => (
                <LessonCard
                  key={lesson.id}
                  deckId={parsedDeckId}
                  lesson={lesson}
                  canMoveUp={index > 0}
                  canMoveDown={index < orderedLessons.length - 1}
                  isLessonOrderPending={movingLessonId !== null}
                  onMoveLesson={handleMoveLesson}
                />
              ))}
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
