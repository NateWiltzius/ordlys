'use client';

import { updateDeckAction } from '@/server/deck.actions';
import { Deck } from '@/types/deck.types';
import { Button, Input, Label, Modal, TextArea, useOverlayState } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import DeckLanguageSelect, {
  languageFormValue,
} from '@/app/(protected)/decks/_components/deck-language-select';
import StatusAlert from '@/components/shared/status-alert';

type Props = {
  deck: Deck;
};

export default function EditDeckModal({ deck }: Props) {
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
        frontLanguage: languageFormValue(data.get('frontLanguage')),
        backLanguage: languageFormValue(data.get('backLanguage')),
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
                <DeckLanguageSelect
                  name="frontLanguage"
                  defaultValue={deck.frontLanguage}
                  label="Front language"
                />
                <DeckLanguageSelect
                  name="backLanguage"
                  defaultValue={deck.backLanguage}
                  label="Back language"
                />
                <p className="text-xs text-default-500">
                  Choose “Not specified” for decks that are not tied to a language.
                </p>
                {error ? <StatusAlert status="danger">{error}</StatusAlert> : null}
              </Modal.Body>
              <Modal.Footer>
                <Button type="submit" isPending={pending} className="w-full sm:w-auto">
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
