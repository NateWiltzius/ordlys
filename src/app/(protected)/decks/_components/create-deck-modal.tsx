'use client';

import DeckFormFields from '@/app/(protected)/decks/_components/deck-form-fields';
import { languageFormValue } from '@/app/(protected)/decks/_components/deck-language-select';
import StatusAlert from '@/components/shared/status-alert';
import { isActionFailure } from '@/lib/action-result';
import { createDeckAction } from '@/server/deck.actions';
import { CreateDeckInput } from '@/types/deck.types';
import { Button, Modal, useOverlayState } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

type CreateDeckModalProps = {
  triggerLabel?: string;
};

export default function CreateDeckModal({ triggerLabel = 'Create Deck' }: CreateDeckModalProps) {
  const modalState = useOverlayState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCreateDeck = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const deck: CreateDeckInput = {
      title: String(formData.get('title') ?? ''),
      description: String(formData.get('description') ?? ''),
      frontLanguage: languageFormValue(formData.get('frontLanguage')),
      backLanguage: languageFormValue(formData.get('backLanguage')),
      visibility: 'private',
    };

    setIsSubmitting(true);
    try {
      setError(null);
      const result = await createDeckAction(deck);
      if (isActionFailure(result)) {
        setError(result.message);
        return;
      }
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
          <Modal.Dialog className="sm:max-w-xl">
            <Modal.CloseTrigger />
            <Modal.Header className="space-y-1">
              <Modal.Heading>Create deck</Modal.Heading>
              <p className="text-sm text-default-500">
                Set up the basics now. You can change these details before or after publishing.
              </p>
            </Modal.Header>
            <form onSubmit={handleCreateDeck}>
              <Modal.Body className="space-y-6">
                <DeckFormFields idPrefix="create-deck" autoFocus />
                <div className="rounded-lg border border-default-200 bg-default-50 p-3 text-sm">
                  <p className="font-medium text-default-700">Starts private</p>
                  <p className="mt-1 text-xs leading-5 text-default-500">
                    Only you can access this deck until you publish and choose a sharing option.
                  </p>
                </div>
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
                  Create deck
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
