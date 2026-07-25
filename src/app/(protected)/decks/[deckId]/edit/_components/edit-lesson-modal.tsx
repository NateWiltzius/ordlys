'use client';

import LessonFormFields from '@/app/(protected)/decks/[deckId]/edit/_components/lesson-form-fields';
import StatusAlert from '@/components/shared/status-alert';
import { isActionFailure } from '@/lib/action-result';
import { updateLessonAction } from '@/server/lesson.actions';
import type { Lesson } from '@/types/lesson.types';
import { Button, Modal, useOverlayState } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

type Props = {
  lesson: Lesson;
};

export default function EditLessonModal({ lesson }: Props) {
  const modalState = useOverlayState();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = String(new FormData(event.currentTarget).get('title') ?? '').trim();
    if (!title) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const result = await updateLessonAction(lesson.id, title);
      if (isActionFailure(result)) {
        setError(result.message);
        return;
      }
      modalState.close();
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not rename the lesson.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal state={modalState}>
      <Button
        size="sm"
        variant="tertiary"
        onPress={() => {
          setError(null);
          modalState.open();
        }}
      >
        Rename
      </Button>
      <Modal.Backdrop>
        <Modal.Container scroll="inside">
          <Modal.Dialog className="min-h-0 sm:max-w-md">
            <Modal.CloseTrigger />
            <Modal.Header className="space-y-1">
              <Modal.Heading>Rename lesson</Modal.Heading>
              <p className="text-sm text-default-500">
                Update the lesson name without changing its cards or learner progress.
              </p>
            </Modal.Header>
            <form onSubmit={handleSubmit} className="mt-2 flex min-h-0 flex-1 flex-col">
              <Modal.Body className="space-y-6">
                <LessonFormFields
                  id={`edit-lesson-${lesson.id}-title`}
                  defaultTitle={lesson.title}
                  autoFocus
                />
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
                  Save changes
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
