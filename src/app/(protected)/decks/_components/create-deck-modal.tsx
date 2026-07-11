'use client';

import { Button, Input, Label, Modal, useOverlayState } from '@heroui/react';
import { FormEvent, useState } from 'react';
import { TextArea } from '@heroui/react';
import { CreateDeckInput } from '@/types/deck.types';
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

    const deck: CreateDeckInput = {
      title: rawTitle as string,
      description: rawDescription as string,
      frontLanguage: languageFormValue(rawFrontLanguage),
      backLanguage: languageFormValue(rawBackLanguage),
      visibility: 'private',
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
                <p className="text-xs text-default-500">
                  New decks start private. Publish when the first draft is ready.
                </p>
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
