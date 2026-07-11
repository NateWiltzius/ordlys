'use client';

import { createLessonAction } from '@/server/lesson.actions';
import { CreateLesson } from '@/types/lesson.types';
import { Button, Input, Label, Modal, useOverlayState } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

type CreateLessonModalProps = {
  triggerLabel?: string;
  deckId: number;
};

export default function CreateLessonModal({
  triggerLabel = 'New lesson',
  deckId,
}: CreateLessonModalProps) {
  const modalState = useOverlayState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleCreateLesson = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);
    const rawTitle = formData.get('title');

    if (typeof rawTitle !== 'string') {
      return;
    }

    const title = rawTitle.trim();
    if (!title) {
      return;
    }

    const lesson: CreateLesson = {
      title,
      deckId,
    };

    setIsSubmitting(true);

    try {
      await createLessonAction(lesson);
      form.reset();
      modalState.close();
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal state={modalState}>
      <Button variant="secondary" onPress={modalState.open}>
        {triggerLabel}
      </Button>

      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[360px]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Create lesson</Modal.Heading>
            </Modal.Header>
            <form onSubmit={handleCreateLesson}>
              <Modal.Body>
                <Label className="text-sm text-default-600" htmlFor="title">
                  Lesson title
                </Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g. Present tense verbs"
                  required
                  maxLength={255}
                  className="w-full"
                />
              </Modal.Body>
              <Modal.Footer>
                <Button className="w-full sm:w-auto" type="submit" isDisabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create lesson'}
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
