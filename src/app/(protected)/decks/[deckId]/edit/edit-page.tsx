'use client';

import LessonCard from '@/components/lesson/lesson-card';
import CreateLessonModal from '@/components/shared/create-lesson-modal';
import PageHeader from '@/components/shared/layout/page-header';
import { Lesson } from '@/types/lesson.types';
import { Vocab } from '@/types/vocab.types';
import { Button, Card } from '@heroui/react';
import Link from 'next/link';

type Props = {
  lessons: Lesson[];
  lessonVocabs: Record<number, Vocab[]>;
  parsedDeckId: number;
};

export default function EditPage({ lessons, lessonVocabs, parsedDeckId }: Props) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit deck"
        description="Organize lessons and vocabulary for this deck."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href={`/decks/${parsedDeckId}`}>
              <Button variant="secondary">Back to deck</Button>
            </Link>
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
            {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
          </p>
        </Card.Header>

        <Card.Content>
          {lessons.length === 0 ? (
            <div className="rounded-lg bg-default-100 px-4 py-6 text-center">
              <p className="font-medium">No lessons yet</p>
              <p className="mt-1 text-sm text-default-500">
                Create your first lesson to start adding vocabulary.
              </p>
              <div className="mt-4 flex justify-center">
                <CreateLessonModal deckId={parsedDeckId} />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {lessons.map(lesson => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  vocabs={lessonVocabs[lesson.id] ?? []}
                />
              ))}
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
