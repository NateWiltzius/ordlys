'use client';

import DeckFormFields from '@/app/(protected)/decks/_components/deck-form-fields';
import { languageFormValue } from '@/app/(protected)/decks/_components/deck-language-select';
import StatusAlert from '@/components/shared/status-alert';
import { isActionFailure } from '@/lib/action-result';
import { createDeckAction } from '@/server/deck.actions';
import { CreateDeckInput } from '@/types/deck.types';
import { Button, Modal, useOverlayState } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useRef, useState } from 'react';

type CreateDeckModalProps = {
  triggerLabel?: string;
  triggerVariant?: 'primary' | 'secondary';
  autoOpen?: boolean;
};

export default function CreateDeckModal({
  triggerLabel = 'Create deck',
  triggerVariant = 'primary',
  autoOpen = false,
}: CreateDeckModalProps) {
  const modalState = useOverlayState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handledAutoOpen = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (!autoOpen || handledAutoOpen.current) return;

    handledAutoOpen.current = true;
    modalState.open();
    router.replace('/decks', { scroll: false });
  }, [autoOpen, modalState, router]);

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
      router.push(`/decks/${result}/edit`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create the deck.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal state={modalState}>
      <Button
        variant={triggerVariant}
        onPress={() => {
          setError(null);
          modalState.open();
        }}
      >
        {triggerLabel}
      </Button>
      <Modal.Backdrop>
        <Modal.Container scroll="inside">
          <Modal.Dialog className="min-h-0 sm:max-w-xl">
            <Modal.CloseTrigger />
            <Modal.Header className="space-y-1">
              <Modal.Heading>Create deck</Modal.Heading>
              <p className="text-sm text-default-500">
                Give your deck a name. You can add cards and publishing details next.
              </p>
            </Modal.Header>
            <form onSubmit={handleCreateDeck} className="flex min-h-0 flex-1 flex-col">
              <Modal.Body className="space-y-5">
                <DeckFormFields idPrefix="create-deck" autoFocus />
                <p className="text-xs leading-5 text-default-500">
                  New decks are private until you choose to publish them.
                </p>
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
