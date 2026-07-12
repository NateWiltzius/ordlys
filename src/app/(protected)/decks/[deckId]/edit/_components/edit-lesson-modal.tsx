'use client';

import { updateLessonAction } from '@/server/lesson.actions';
import type { Lesson } from '@/types/lesson.types';
import { Button, Input, Label, Modal, useOverlayState } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import StatusAlert from '@/components/shared/status-alert';
import { isActionFailure } from '@/lib/action-result';

type Props = {
  lesson: Lesson;
};

export default function EditLessonModal({ lesson }: Props) {
  const state = useOverlayState();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = String(new FormData(event.currentTarget).get('title') ?? '');
    try {
      setPending(true);
      setError(null);
      const result = await updateLessonAction(lesson.id, title);
      if (isActionFailure(result)) {
        setError(result.message);
        return;
      }
      state.close();
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not rename the lesson.');
    } finally {
      setPending(false);
    }
  }
  return (
    <Modal state={state}>
      <Button size="sm" variant="tertiary" onPress={state.open}>
        Rename
      </Button>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[360px]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Rename lesson</Modal.Heading>
            </Modal.Header>
            <form onSubmit={submit}>
              <Modal.Body>
                <Label htmlFor={`lesson-title-${lesson.id}`}>Title</Label>
                <Input
                  id={`lesson-title-${lesson.id}`}
                  name="title"
                  defaultValue={lesson.title}
                  required
                  maxLength={255}
                />
                {error ? <StatusAlert status="danger">{error}</StatusAlert> : null}
              </Modal.Body>
              <Modal.Footer>
                <Button type="submit" isPending={pending} className="w-full sm:w-auto">
                  Save
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
