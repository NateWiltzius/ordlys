'use client';

import { Button, Input, Label, ListBox, Modal, Select, useOverlayState } from '@heroui/react';
import { FormEvent, useState } from 'react';
import { TextArea } from '@heroui/react';
import { CreateDeckInput, DeckVisibility } from '@/types/deck.types';
import { createDeckAction } from '@/server/deck.actions';
import { useRouter } from 'next/navigation';
import DeckLanguageSelect, {
  languageFormValue,
} from '@/app/(protected)/decks/_components/deck-language-select';

type CreateDeckModalProps = {
  triggerLabel?: string;
};

export default function CreateDeckModal({ triggerLabel = 'Create Deck' }: CreateDeckModalProps) {
  const modalState = useOverlayState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCreateDeck = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);
    const rawTitle = formData.get('title');
    const rawDescription = formData.get('description');
    const rawFrontLanguage = formData.get('frontLanguage');
    const rawBackLanguage = formData.get('backLanguage');
    const rawVisibility = formData.get('visibility');

    const deck: CreateDeckInput = {
      title: rawTitle as string,
      description: rawDescription as string,
      frontLanguage: languageFormValue(rawFrontLanguage),
      backLanguage: languageFormValue(rawBackLanguage),
      visibility: rawVisibility as DeckVisibility,
    };

    setIsSubmitting(true);
    try {
      setError(null);
      await createDeckAction(deck);
      form.reset();
      modalState.close();
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create the deck.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal state={modalState}>
      <Button variant="secondary">{triggerLabel}</Button>

      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[360px]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Create Deck</Modal.Heading>
            </Modal.Header>
            <form onSubmit={handleCreateDeck}>
              <Modal.Body className="flex flex-col gap-4">
                <div>
                  <Label className="text-sm text-default-600" htmlFor="title">
                    Deck title
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g. Norwegian Vocabulary"
                    required
                    maxLength={255}
                    className="w-full"
                  />
                </div>
                <div>
                  <Label className="text-sm text-default-600" htmlFor="description">
                    Description
                  </Label>
                  <TextArea
                    id="description"
                    name="description"
                    placeholder="e.g. A deck for learning Norwegian vocabulary"
                    required
                    maxLength={255}
                    className="w-full"
                  />
                </div>
                <div className="flex flex-col gap-4">
                  <DeckLanguageSelect name="frontLanguage" label="Front language" />
                  <DeckLanguageSelect name="backLanguage" label="Back language" />
                  <p className="mt-1 text-xs text-default-500">
                    Choose “Not specified” for decks that are not tied to a language.
                  </p>
                </div>
                <div>
                  <Select name="visibility" defaultValue="public">
                    <Label className="text-sm text-default-600" htmlFor="visibility">
                      Visibility
                    </Label>
                    <Select.Trigger>
                      <span className="sr-only">Visibility</span>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        <ListBox.Item id="public" textValue="Public">
                          Public
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                        <ListBox.Item id="private" textValue="Private">
                          Private
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>
              </Modal.Body>
              <Modal.Footer>
                {error ? (
                  <p role="alert" className="text-sm text-danger">
                    {error}
                  </p>
                ) : null}
                <Button className="w-full" type="submit" isDisabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Deck'}
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
