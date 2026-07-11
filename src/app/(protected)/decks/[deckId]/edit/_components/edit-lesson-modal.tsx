'use client';

import { updateLessonAction } from '@/server/lesson.actions';
import type { Lesson } from '@/types/lesson.types';
import { Button, Input, Label, Modal, useOverlayState } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

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
      await updateLessonAction(lesson.id, title);
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
                {error ? (
                  <p role="alert" className="text-sm text-danger">
                    {error}
                  </p>
                ) : null}
              </Modal.Body>
              <Modal.Footer>
                <Button type="submit" isPending={pending}>
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
