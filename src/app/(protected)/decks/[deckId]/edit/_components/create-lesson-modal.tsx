'use client';

import LessonFormFields from '@/app/(protected)/decks/[deckId]/edit/_components/lesson-form-fields';
import StatusAlert from '@/components/shared/status-alert';
import { isActionFailure } from '@/lib/action-result';
import { createLessonAction } from '@/server/lesson.actions';
import { CreateLesson } from '@/types/lesson.types';
import { Button, Modal, useOverlayState } from '@heroui/react';
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
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const title = String(new FormData(form).get('title') ?? '').trim();
    if (!title) return;

    const lesson: CreateLesson = { title, deckId };
    setIsSubmitting(true);
    try {
      setError(null);
      const result = await createLessonAction(lesson);
      if (isActionFailure(result)) {
        setError(result.message);
        return;
      }
      form.reset();
      modalState.close();
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create the lesson.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal state={modalState}>
      <Button
        variant="secondary"
        onPress={() => {
          setError(null);
          modalState.open();
        }}
      >
        {triggerLabel}
      </Button>
      <Modal.Backdrop>
        <Modal.Container scroll="inside">
          <Modal.Dialog className="sm:max-w-md">
            <Modal.CloseTrigger />
            <Modal.Header className="space-y-1">
              <Modal.Heading>Create lesson</Modal.Heading>
              <p className="text-sm text-default-500">
                Add a focused section to organize this deck’s vocabulary.
              </p>
            </Modal.Header>
            <form onSubmit={handleSubmit}>
              <Modal.Body className="space-y-6">
                <LessonFormFields id={`create-lesson-${deckId}-title`} autoFocus />
                {error ? <StatusAlert status="danger">{error}</StatusAlert> : null}
              </Modal.Body>
              <Modal.Footer className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="tertiary"
                  className="w-full sm:w-auto"
                  isDisabled={isSubmitting}
                  onPress={modalState.close}
                >
                  Cancel
                </Button>
                <Button className="w-full sm:w-auto" type="submit" isPending={isSubmitting}>
                  Create lesson
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
