'use client';

import LessonCard from '@/components/lesson/lesson-card';
import CreateLessonModal from '@/components/shared/create-lesson-modal';
import PageHeader from '@/components/shared/layout/page-header';
import { Lesson } from '@/types/lesson.types';
import { Vocab } from '@/types/vocab.types';
import { Card } from '@heroui/react';
import ButtonLink from '@/components/shared/button-link';
import EmptyState from '@/components/shared/empty-state';
import { moveLessonAction } from '@/server/lesson.actions';
import { moveItem } from '@/lib/order/move-item';
import { OrderDirection } from '@/types/order.types';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  lessons: Lesson[];
  lessonVocabs: Record<number, Vocab[]>;
  parsedDeckId: number;
};

export default function EditPage({ lessons, lessonVocabs, parsedDeckId }: Props) {
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
        description="Organize lessons and vocabulary for this deck."
        actions={
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={`/decks/${parsedDeckId}`} variant="secondary">
              Back to deck
            </ButtonLink>
            <CreateLessonModal deckId={parsedDeckId} />
          </div>
        }
      />

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
            <div className="space-y-4">
              {orderedLessons.map((lesson, index) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  vocabs={lessonVocabs[lesson.id] ?? []}
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
