'use client';

import { updateDeckAction } from '@/server/deck.actions';
import { Deck, DeckVisibility } from '@/types/deck.types';
import {
  Button,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  TextArea,
  useOverlayState,
} from '@heroui/react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

export default function EditDeckModal({ deck }: { deck: Deck }) {
  const state = useOverlayState();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      setPending(true);
      setError(null);
      await updateDeckAction(deck.id, {
        title: String(data.get('title') ?? ''),
        description: String(data.get('description') ?? ''),
        visibility: String(data.get('visibility')) as DeckVisibility,
      });
      state.close();
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update the deck.');
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal state={state}>
      <Button variant="secondary" onPress={state.open}>
        Edit details
      </Button>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[420px]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Edit deck</Modal.Heading>
            </Modal.Header>
            <form onSubmit={submit}>
              <Modal.Body className="flex flex-col gap-3">
                <Label htmlFor="deck-title">Title</Label>
                <Input
                  id="deck-title"
                  name="title"
                  defaultValue={deck.title}
                  required
                  maxLength={255}
                />
                <Label htmlFor="deck-description">Description</Label>
                <TextArea
                  id="deck-description"
                  name="description"
                  defaultValue={deck.description ?? ''}
                  maxLength={255}
                />
                <Select name="visibility" defaultValue={deck.visibility ?? 'private'}>
                  <Label>Visibility</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item id="public">
                        Public
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      <ListBox.Item id="private">
                        Private
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    </ListBox>
                  </Select.Popover>
                </Select>
                {error ? (
                  <p role="alert" className="text-sm text-danger">
                    {error}
                  </p>
                ) : null}
              </Modal.Body>
              <Modal.Footer>
                <Button type="submit" isPending={pending}>
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
