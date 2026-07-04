'use client';

import { useState } from 'react';
import CreateVocabModal from '@/components/shared/create-vocab-modal';
import VocabCard from '@/components/vocab/vocab-card';
import { deleteLessonAction } from '@/server/lesson.actions';
import { Lesson } from '@/types/lesson.types';
import { Vocab } from '@/types/vocab.types';
import { Button, Card, Chip } from '@heroui/react';
import { useRouter } from 'next/navigation';

type Props = {
  lesson: Lesson;
  vocabs: Vocab[];
};

export default function LessonCard({ lesson, vocabs }: Props) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (isDeleting) return;

    try {
      setIsDeleting(true);
      await deleteLessonAction(lesson.id);
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <Card.Header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Card.Title>{lesson.title}</Card.Title>
          <Card.Description>Manage the words in this lesson.</Card.Description>
        </div>

        <Chip size="sm" variant="soft">
          {vocabs.length} {vocabs.length === 1 ? 'word' : 'words'}
        </Chip>
      </Card.Header>

      <Card.Content>
        {vocabs.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {vocabs.map(vocab => (
              <VocabCard key={vocab.id} vocab={vocab} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-default-100 px-4 py-3">
            <p className="text-sm font-medium">No words yet</p>
            <p className="mt-1 text-sm text-default-500">
              Add vocabulary to start building this lesson.
            </p>
          </div>
        )}
      </Card.Content>

      <Card.Footer className="flex flex-wrap gap-2">
        <CreateVocabModal lessonId={lesson.id} />
        <Button size="sm" variant="danger-soft" isPending={isDeleting} onPress={handleDelete}>
          Delete lesson
        </Button>
      </Card.Footer>
    </Card>
  );
}
