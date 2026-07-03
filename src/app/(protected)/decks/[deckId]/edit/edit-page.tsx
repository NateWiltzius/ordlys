'use client';

import LessonCard from '@/components/lesson/lesson-card';
import CreateLessonModal from '@/components/shared/create-lesson-modal';
import { Lesson } from '@/types/lesson.types';
import { Vocab } from '@/types/vocab.types';
import { Button } from '@heroui/react';
import { useRouter } from 'next/navigation';

type Props = {
  lessons: Lesson[];
  lessonVocabs: Record<number, Vocab[]>;
  parsedDeckId: number;
};

export default function EditPage({ lessons, lessonVocabs, parsedDeckId }: Props) {
  const router = useRouter();

  return (
    <>
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-medium">Lessons</h2>
        <Button variant="secondary" onPress={() => router.push(`/decks/${parsedDeckId}`)}>
          Back to Deck
        </Button>
        <CreateLessonModal deckId={parsedDeckId} />
      </div>
      {lessons.length === 0 ? (
        <p className="text-default-500">No lessons yet. Create your first lesson.</p>
      ) : (
        lessons.map(lesson => (
          <LessonCard key={lesson.id} lesson={lesson} vocabs={lessonVocabs[lesson.id] ?? []} />
        ))
      )}
    </>
  );
}
