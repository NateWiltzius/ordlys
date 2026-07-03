'use client';

import CreateVocabModal from '@/components/shared/create-vocab-modal';
import VocabCard from '@/components/vocab/vocab-card';
import { deleteLessonAction } from '@/server/lesson.actions';
import { Lesson } from '@/types/lesson.types';
import { Vocab } from '@/types/vocab.types';
import { Button, Card } from '@heroui/react';

type Props = {
  lesson: Lesson;
  vocabs: Vocab[];
};

export default function LessonCard({ lesson, vocabs }: Props) {
  return (
    <Card className="border border-default-200 shadow-sm">
      <Card.Header className="flex items-center justify-between gap-3 pb-2">
        <Card.Title>{lesson.title}</Card.Title>
        <p className="text-xs text-default-500">
          {vocabs.length} {vocabs.length === 1 ? 'vocab' : 'vocabs'}
        </p>
      </Card.Header>

      <div className="space-y-2 px-4 pb-3 pt-0">
        {vocabs.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {vocabs.map(vocab => (
              <VocabCard key={vocab.id} vocab={vocab} />
            ))}
          </div>
        ) : (
          <p className="rounded-md bg-default-100 px-3 py-2 text-sm text-default-500">
            No vocabs yet.
          </p>
        )}
      </div>

      <Card.Footer className="flex items-center gap-2 pt-0">
        <CreateVocabModal lessonId={lesson.id} />
        <Button size="sm" variant="danger-soft" onClick={() => deleteLessonAction(lesson.id)}>
          Delete
        </Button>
      </Card.Footer>
    </Card>
  );
}
